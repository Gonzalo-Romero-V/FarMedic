<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Farmacia;
use App\Models\Lote;
use App\Models\Medicamento;
use App\Models\MovimientoStock;
use App\Models\Pedido;
use App\Models\PedidoItem;
use App\Models\Sucursal;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Pedidos no se eliminan — se usan los estados (cancelado).
 * - store(): crea pedido + items + reserva lotes FEFO (lote_id en items)
 *   No descuenta stock todavía: lo hace cuando pasa a 'entregado'.
 * - cambiarEstado(): pendiente→en_camino→entregado→(stock descontado);
 *   cancelado revierte si ya había movimientos.
 *
 * `cliente_id` no se acepta del body — viene de auth()->user(). Refuerza que un
 * cliente solo pueda crear pedidos a su propio nombre. `index/show` filtran
 * automáticamente por cliente cuando el rol del user lo es (alineado a [[rbac]]
 * permiso `orders.read.own`).
 */
class PedidoController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $q = Pedido::with(['items.medicamento', 'cliente', 'gestor', 'sucursal']);

        // Cliente: solo SUS pedidos. Admin/empleado: ven todos y pueden filtrar.
        if ($user->esCliente()) {
            $q->where('cliente_id', $user->id);
        } else {
            if ($request->filled('cliente_id')) {
                $q->where('cliente_id', $request->cliente_id);
            }
            if ($request->filled('sucursal_id')) {
                $q->where('sucursal_id', $request->sucursal_id);
            }
        }

        if ($request->filled('estado')) {
            $q->where('estado', $request->estado);
        }

        return $q->orderByDesc('fecha_solicitud')->paginate($request->integer('per_page', 25));
    }

    public function show(Request $request, Pedido $pedido)
    {
        $user = $request->user();
        if ($user->esCliente() && $pedido->cliente_id !== $user->id) {
            abort(403, 'Pedido de otro cliente');
        }
        return $pedido->load(['items.medicamento', 'items.lote', 'cliente', 'gestor', 'receta', 'sucursal']);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        abort_unless($user->esCliente(), 403, 'Solo clientes pueden crear pedidos');

        $validated = $request->validate([
            'sucursal_id' => ['required', 'exists:sucursales,id'],
            'receta_id' => ['nullable', 'exists:recetas,id'],
            'tipo_entrega' => ['required', 'in:retiro_local,domicilio'],
            'direccion_envio' => ['required_if:tipo_entrega,domicilio', 'nullable', 'string', 'max:255'],
            'telefono_contacto' => ['required', 'string', 'max:50'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.medicamento_id' => ['required', 'exists:medicamentos,id'],
            'items.*.cantidad' => ['required', 'integer', 'min:1'],
        ]);

        // La sucursal elegida debe estar activa (cliente no debe poder pedir a sucursal cerrada).
        $sucursalActiva = Sucursal::where('id', $validated['sucursal_id'])->where('activa', true)->exists();
        abort_unless($sucursalActiva, 422, 'Sucursal no disponible para pedidos');

        return DB::transaction(function () use ($validated, $user) {
            $sucursalId = $validated['sucursal_id'];
            $ivaTasa = Farmacia::value('iva_tasa');

            $medIds = collect($validated['items'])->pluck('medicamento_id');
            $requieren = Medicamento::whereIn('id', $medIds)->where('requiere_receta', true)->exists();
            if ($requieren && empty($validated['receta_id'])) {
                abort(422, 'Receta requerida: hay items con requiere_receta=true');
            }

            $subtotal = 0;
            $itemsParaCrear = [];

            foreach ($validated['items'] as $i) {
                $med = Medicamento::findOrFail($i['medicamento_id']);
                abort_if($med->sucursal_id !== $sucursalId, 422, "Medicamento {$med->id} no pertenece a la sucursal elegida");

                $restante = $i['cantidad'];

                // FEFO + reserva: asignamos lote pero NO descontamos cantidad_actual aún
                // (solo se descuenta al pasar a 'entregado'). lockForUpdate para evitar
                // que dos pedidos reserven el mismo stock concurrentemente.
                $lotes = Lote::where('medicamento_id', $med->id)
                    ->where('sucursal_id', $sucursalId)
                    ->where('cantidad_actual', '>', 0)
                    ->where('fecha_vencimiento', '>=', now()->toDateString())
                    ->orderBy('fecha_vencimiento')
                    ->lockForUpdate()
                    ->get();

                $totalDisponible = $lotes->sum('cantidad_actual');
                if ($totalDisponible < $restante) {
                    abort(422, "Stock insuficiente para medicamento_id={$med->id}");
                }

                // Asignar al lote con vencimiento más próximo (simplificación: un solo lote por item)
                $loteAsignado = $lotes->first();
                $subItem = $med->precio * $i['cantidad'];
                $subtotal += $subItem;

                $itemsParaCrear[] = [
                    'medicamento_id' => $med->id,
                    'lote_id' => $loteAsignado->id,
                    'cantidad' => $i['cantidad'],
                    'precio_unitario' => $med->precio,
                    'subtotal' => $subItem,
                ];
            }

            $impuesto = round($subtotal * ($ivaTasa / 100), 2);
            $total = $subtotal + $impuesto;

            $pedido = Pedido::create([
                'sucursal_id' => $sucursalId,
                'cliente_id' => $user->id,
                'receta_id' => $validated['receta_id'] ?? null,
                'numero_pedido' => $this->siguientePedido($sucursalId),
                'tipo_entrega' => $validated['tipo_entrega'],
                'direccion_envio' => $validated['direccion_envio'] ?? null,
                'telefono_contacto' => $validated['telefono_contacto'],
                'estado' => 'pendiente',
                'subtotal' => $subtotal,
                'iva_tasa_aplicada' => $ivaTasa,
                'impuesto_total' => $impuesto,
                'total' => $total,
                'fecha_solicitud' => now(),
            ]);

            foreach ($itemsParaCrear as $item) {
                $item['pedido_id'] = $pedido->id;
                PedidoItem::create($item);
            }

            return $pedido->load(['items.medicamento', 'items.lote', 'sucursal', 'cliente', 'receta']);
        });
    }

    /**
     * Transición de estado del pedido. Genera movimientos al pasar a 'entregado'
     * y los revierte si se cancela tras estar entregado. Admin+empleado por ruta.
     */
    public function cambiarEstado(Request $request, Pedido $pedido)
    {
        $user = $request->user();

        // Empleado solo puede gestionar pedidos de su sucursal.
        if ($user->esEmpleado() && $pedido->sucursal_id !== $user->sucursal_id) {
            abort(403, 'Pedido de otra sucursal');
        }

        $validated = $request->validate([
            'estado' => ['required', 'in:pendiente,en_camino,entregado,cancelado'],
        ]);

        $nuevo = $validated['estado'];
        $previo = $pedido->estado;

        $transicionesValidas = [
            'pendiente' => ['en_camino', 'cancelado'],
            'en_camino' => ['entregado', 'cancelado'],
            'entregado' => ['cancelado'],
            'cancelado' => [],
        ];
        if (!in_array($nuevo, $transicionesValidas[$previo])) {
            abort(409, "Transición inválida: {$previo} -> {$nuevo}");
        }

        return DB::transaction(function () use ($pedido, $nuevo, $previo, $user) {
            $updates = ['estado' => $nuevo, 'usuario_id_gestor' => $user->id];

            if ($nuevo === 'en_camino') {
                $updates['fecha_envio'] = now();
            }

            if ($nuevo === 'entregado') {
                $updates['fecha_entrega'] = now();
                foreach ($pedido->items as $item) {
                    if (!$item->lote_id) continue;
                    $lote = $item->lote()->lockForUpdate()->first();
                    if ($lote->cantidad_actual < $item->cantidad) {
                        abort(422, "Stock insuficiente al entregar (lote {$lote->id})");
                    }
                    $lote->cantidad_actual -= $item->cantidad;
                    $lote->save();

                    MovimientoStock::create([
                        'lote_id' => $lote->id,
                        'sucursal_id' => $pedido->sucursal_id,
                        'usuario_id' => $user->id,
                        'tipo' => 'venta',
                        'cantidad' => -$item->cantidad,
                        'referencia_tipo' => Pedido::class,
                        'referencia_id' => $pedido->id,
                    ]);
                }
            }

            if ($nuevo === 'cancelado' && $previo === 'entregado') {
                foreach ($pedido->items as $item) {
                    if (!$item->lote_id) continue;
                    $lote = $item->lote()->lockForUpdate()->first();
                    $lote->cantidad_actual += $item->cantidad;
                    $lote->save();

                    MovimientoStock::create([
                        'lote_id' => $lote->id,
                        'sucursal_id' => $pedido->sucursal_id,
                        'usuario_id' => $user->id,
                        'tipo' => 'devolucion_cliente',
                        'cantidad' => $item->cantidad,
                        'referencia_tipo' => Pedido::class,
                        'referencia_id' => $pedido->id,
                        'justificacion' => 'Cancelación de pedido entregado',
                    ]);
                }
            }

            $pedido->update($updates);
            return $pedido->load(['items.medicamento', 'items.lote']);
        });
    }

    /**
     * Serial autoincremental zero-padded por sucursal (mismo patrón que VentaController).
     * lockForUpdate serializa la generación dentro de la transacción del store.
     */
    private function siguientePedido(int $sucursalId): string
    {
        $ultimo = Pedido::where('sucursal_id', $sucursalId)
            ->lockForUpdate()
            ->orderByDesc('id')
            ->value('numero_pedido');

        $n = $ultimo ? ((int) $ultimo) + 1 : 1;
        return str_pad((string) $n, 7, '0', STR_PAD_LEFT);
    }
}
