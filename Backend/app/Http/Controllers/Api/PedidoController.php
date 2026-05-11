<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Farmacia;
use App\Models\Lote;
use App\Models\Medicamento;
use App\Models\MovimientoStock;
use App\Models\Pedido;
use App\Models\PedidoItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Pedidos no se eliminan — se usan los estados (cancelado).
 * - store(): crea pedido + items + reserva lotes FEFO (lote_id en items)
 *   No descuenta stock todavía: lo hace cuando pasa a 'entregado'.
 * - cambiarEstado(): pendiente→en_camino→entregado→(stock descontado);
 *   cancelado revierte si ya había movimientos.
 */
class PedidoController extends Controller
{
    public function index(Request $request)
    {
        $q = Pedido::with(['items.medicamento', 'cliente', 'gestor']);
        if ($request->filled('sucursal_id')) {
            $q->where('sucursal_id', $request->sucursal_id);
        }
        if ($request->filled('cliente_id')) {
            $q->where('cliente_id', $request->cliente_id);
        }
        if ($request->filled('estado')) {
            $q->where('estado', $request->estado);
        }
        return $q->orderBy('fecha_solicitud')->paginate($request->integer('per_page', 25));
    }

    public function show(Pedido $pedido)
    {
        return $pedido->load(['items.medicamento', 'items.lote', 'cliente', 'gestor', 'receta']);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sucursal_id' => ['required', 'exists:sucursales,id'],
            'cliente_id' => ['required', 'exists:usuarios,id'],
            'receta_id' => ['nullable', 'exists:recetas,id'],
            'tipo_entrega' => ['required', 'in:retiro_local,domicilio'],
            'direccion_envio' => ['required_if:tipo_entrega,domicilio', 'nullable', 'string', 'max:255'],
            'telefono_contacto' => ['required', 'string', 'max:50'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.medicamento_id' => ['required', 'exists:medicamentos,id'],
            'items.*.cantidad' => ['required', 'integer', 'min:1'],
        ]);

        return DB::transaction(function () use ($validated) {
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
                $restante = $i['cantidad'];

                // FEFO + reserva: asignamos lote pero NO descontamos cantidad_actual aún
                // (solo se descuenta al pasar a 'entregado')
                $lotes = Lote::where('medicamento_id', $med->id)
                    ->where('sucursal_id', $sucursalId)
                    ->where('cantidad_actual', '>', 0)
                    ->where('fecha_vencimiento', '>=', now()->toDateString())
                    ->orderBy('fecha_vencimiento')
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
                'cliente_id' => $validated['cliente_id'],
                'receta_id' => $validated['receta_id'] ?? null,
                'numero_pedido' => 'P-' . now()->format('YmdHis') . '-' . random_int(100, 999),
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

            return $pedido->load('items.medicamento');
        });
    }

    /**
     * Transición de estado del pedido. Genera movimientos al pasar a 'entregado'
     * y los revierte si se cancela tras estar entregado.
     */
    public function cambiarEstado(Request $request, Pedido $pedido)
    {
        $validated = $request->validate([
            'estado' => ['required', 'in:pendiente,en_camino,entregado,cancelado'],
            'usuario_id_gestor' => ['nullable', 'exists:usuarios,id'],
        ]);

        $nuevo = $validated['estado'];
        $previo = $pedido->estado;

        // Validaciones de transición
        $transicionesValidas = [
            'pendiente' => ['en_camino', 'cancelado'],
            'en_camino' => ['entregado', 'cancelado'],
            'entregado' => ['cancelado'],
            'cancelado' => [],
        ];
        if (!in_array($nuevo, $transicionesValidas[$previo])) {
            abort(409, "Transición inválida: {$previo} -> {$nuevo}");
        }

        return DB::transaction(function () use ($pedido, $nuevo, $previo, $validated) {
            $updates = ['estado' => $nuevo];
            if (!empty($validated['usuario_id_gestor'])) {
                $updates['usuario_id_gestor'] = $validated['usuario_id_gestor'];
            }

            if ($nuevo === 'en_camino') {
                $updates['fecha_envio'] = now();
            }

            if ($nuevo === 'entregado') {
                $updates['fecha_entrega'] = now();
                // Descontar stock real ahora
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
                        'usuario_id' => $validated['usuario_id_gestor'] ?? null,
                        'tipo' => 'venta',
                        'cantidad' => -$item->cantidad,
                        'referencia_tipo' => Pedido::class,
                        'referencia_id' => $pedido->id,
                    ]);
                }
            }

            if ($nuevo === 'cancelado' && $previo === 'entregado') {
                // Revertir movimientos
                foreach ($pedido->items as $item) {
                    if (!$item->lote_id) continue;
                    $lote = $item->lote()->lockForUpdate()->first();
                    $lote->cantidad_actual += $item->cantidad;
                    $lote->save();

                    MovimientoStock::create([
                        'lote_id' => $lote->id,
                        'sucursal_id' => $pedido->sucursal_id,
                        'usuario_id' => $validated['usuario_id_gestor'] ?? null,
                        'tipo' => 'devolucion_cliente',
                        'cantidad' => $item->cantidad,
                        'referencia_tipo' => Pedido::class,
                        'referencia_id' => $pedido->id,
                        'justificacion' => 'Cancelación de pedido entregado',
                    ]);
                }
            }

            $pedido->update($updates);
            return $pedido->load('items');
        });
    }
}
