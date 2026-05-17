<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Farmacia;
use App\Models\Lote;
use App\Models\Medicamento;
use App\Models\MovimientoStock;
use App\Models\Usuario;
use App\Models\Venta;
use App\Models\VentaItem;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Ventas son inmutables tras confirmar. Solo se permite cambiar estado a 'anulada' (genera
 * movimientos inversos). store() es transaccional: descuenta lotes FEFO + crea items +
 * crea movimientos Kardex tipo='venta'.
 *
 * sucursal_id y usuario_id NO se aceptan del body — se toman de auth()->user() para evitar
 * que un empleado venda contra otra sucursal o atribuya la venta a otro usuario
 * (domain/venta.md + decisions/rbac.md).
 */
class VentaController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $q = Venta::with(['items.lote.medicamento', 'usuario', 'cliente']);

        // Empleado solo ve ventas de su sucursal; admin ve todas (puede filtrar).
        if ($user->esEmpleado()) {
            $q->where('sucursal_id', $user->sucursal_id);
        } elseif ($request->filled('sucursal_id')) {
            $q->where('sucursal_id', $request->sucursal_id);
        }

        if ($request->filled('estado')) {
            $q->where('estado', $request->estado);
        }
        if ($request->filled('metodo_pago')) {
            $q->where('metodo_pago', $request->metodo_pago);
        }
        if ($request->filled('desde')) {
            $q->whereDate('fecha', '>=', $request->desde);
        }
        if ($request->filled('hasta')) {
            $q->whereDate('fecha', '<=', $request->hasta);
        }

        return $q->orderByDesc('fecha')->paginate($request->integer('per_page', 25));
    }

    public function show(Request $request, Venta $venta)
    {
        $user = $request->user();
        if ($user->esEmpleado() && $venta->sucursal_id !== $user->sucursal_id) {
            abort(403, 'Venta de otra sucursal');
        }
        return $venta->load(['items.lote.medicamento', 'usuario', 'cliente', 'receta', 'sucursal']);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        abort_if($user->sucursal_id === null, 422, 'Usuario sin sucursal asignada no puede vender');

        $validated = $request->validate([
            'cliente_id' => ['nullable', 'exists:usuarios,id'],
            'receta_id' => ['nullable', 'exists:recetas,id'],
            'metodo_pago' => ['required', 'in:efectivo,tarjeta,transferencia'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.medicamento_id' => ['required', 'exists:medicamentos,id'],
            'items.*.cantidad' => ['required', 'integer', 'min:1'],
            'items.*.descuento_item' => ['nullable', 'numeric', 'min:0'],
        ]);

        // cliente_id, si viene, debe ser un usuario con rol cliente
        if (!empty($validated['cliente_id'])) {
            $esCliente = Usuario::clientes()->whereKey($validated['cliente_id'])->exists();
            abort_unless($esCliente, 422, 'cliente_id no corresponde a un cliente');
        }

        return DB::transaction(function () use ($validated, $user) {
            $sucursalId = $user->sucursal_id;
            $ivaTasa = Farmacia::value('iva_tasa');

            // Validar receta si algún medicamento la requiere
            $medIds = collect($validated['items'])->pluck('medicamento_id');
            $requieren = Medicamento::whereIn('id', $medIds)->where('requiere_receta', true)->exists();
            if ($requieren && empty($validated['receta_id'])) {
                abort(422, 'Receta requerida: hay items con requiere_receta=true');
            }

            $subtotal = 0;
            $itemsParaCrear = [];

            foreach ($validated['items'] as $i) {
                $med = Medicamento::findOrFail($i['medicamento_id']);
                abort_if($med->sucursal_id !== $sucursalId, 422, "Medicamento {$med->id} no pertenece a la sucursal del usuario");

                $restante = $i['cantidad'];

                // FEFO: lotes con stock, vencimiento más próximo primero
                $lotes = Lote::where('medicamento_id', $med->id)
                    ->where('sucursal_id', $sucursalId)
                    ->where('cantidad_actual', '>', 0)
                    ->where('fecha_vencimiento', '>=', now()->toDateString())
                    ->orderBy('fecha_vencimiento')
                    ->lockForUpdate()
                    ->get();

                foreach ($lotes as $lote) {
                    if ($restante <= 0) break;
                    $usar = min($restante, $lote->cantidad_actual);
                    $descuentoItem = ($i['descuento_item'] ?? 0) * ($usar / $i['cantidad']);
                    $subItem = ($usar * $med->precio) - $descuentoItem;
                    $subtotal += $subItem;

                    $itemsParaCrear[] = [
                        'lote_id' => $lote->id,
                        'cantidad' => $usar,
                        'precio_unitario' => $med->precio,
                        'descuento_item' => $descuentoItem,
                        'subtotal' => $subItem,
                    ];

                    $lote->cantidad_actual -= $usar;
                    $lote->save();
                    $restante -= $usar;
                }

                if ($restante > 0) {
                    abort(422, "Stock insuficiente para medicamento_id={$med->id}");
                }
            }

            $base = max(0, $subtotal);
            $impuesto = round($base * ($ivaTasa / 100), 2);
            $total = $base + $impuesto;

            $venta = Venta::create([
                'sucursal_id' => $sucursalId,
                'usuario_id' => $user->id,
                'cliente_id' => $validated['cliente_id'] ?? null,
                'receta_id' => $validated['receta_id'] ?? null,
                'numero_comprobante' => $this->siguienteComprobante($sucursalId),
                'subtotal' => $subtotal,
                'descuento_total' => 0,
                'iva_tasa_aplicada' => $ivaTasa,
                'impuesto_total' => $impuesto,
                'total' => $total,
                'metodo_pago' => $validated['metodo_pago'],
                'estado' => 'completada',
                'fecha' => now(),
            ]);

            foreach ($itemsParaCrear as $item) {
                $item['venta_id'] = $venta->id;
                $vi = VentaItem::create($item);

                MovimientoStock::create([
                    'lote_id' => $vi->lote_id,
                    'sucursal_id' => $sucursalId,
                    'usuario_id' => $user->id,
                    'tipo' => 'venta',
                    'cantidad' => -$vi->cantidad,
                    'referencia_tipo' => Venta::class,
                    'referencia_id' => $venta->id,
                ]);
            }

            return $venta->load(['items.lote.medicamento', 'cliente', 'receta', 'usuario']);
        });
    }

    /**
     * Comprobante PDF de la venta. Mismo enforcement que show(): empleado solo
     * accede a las ventas de su sucursal; admin a todas. Render con Blade + dompdf
     * (misma stack que reportes.mensual).
     */
    public function comprobantePdf(Request $request, Venta $venta)
    {
        $user = $request->user();
        if ($user->esEmpleado() && $venta->sucursal_id !== $user->sucursal_id) {
            abort(403, 'Venta de otra sucursal');
        }

        $venta->load(['items.lote.medicamento', 'usuario', 'cliente', 'sucursal', 'receta']);
        $farmacia = Farmacia::first();

        $pdf = Pdf::loadView('ventas.comprobante', [
            'venta' => $venta,
            'farmacia' => $farmacia,
        ])->setPaper('a4', 'portrait');

        $filename = sprintf('comprobante-%s.pdf', $venta->numero_comprobante);
        return $pdf->download($filename);
    }

    /**
     * Anular una venta: revierte stock con movimientos devolucion_cliente.
     * Solo admin (restringido por ruta).
     */
    public function anular(Request $request, Venta $venta)
    {
        if ($venta->estado === 'anulada') {
            abort(409, 'Venta ya anulada');
        }

        $validated = $request->validate([
            'justificacion' => ['required', 'string'],
        ]);

        $user = $request->user();

        return DB::transaction(function () use ($venta, $validated, $user) {
            foreach ($venta->items as $item) {
                $lote = $item->lote()->lockForUpdate()->first();
                $lote->cantidad_actual += $item->cantidad;
                $lote->save();

                MovimientoStock::create([
                    'lote_id' => $item->lote_id,
                    'sucursal_id' => $venta->sucursal_id,
                    'usuario_id' => $user->id,
                    'tipo' => 'devolucion_cliente',
                    'cantidad' => $item->cantidad,
                    'referencia_tipo' => Venta::class,
                    'referencia_id' => $venta->id,
                    'justificacion' => $validated['justificacion'],
                ]);
            }

            $venta->update(['estado' => 'anulada']);
            return $venta->load('items');
        });
    }

    /**
     * Serial autoincremental zero-padded por sucursal (domain/venta.md).
     * Se invoca dentro de la transacción del store(): el lockForUpdate sobre las ventas
     * existentes de la sucursal serializa la generación para evitar colisiones bajo
     * concurrencia. El unique index (sucursal_id, numero_comprobante) sigue siendo el
     * backstop final.
     */
    private function siguienteComprobante(int $sucursalId): string
    {
        $ultimo = Venta::where('sucursal_id', $sucursalId)
            ->lockForUpdate()
            ->orderByDesc('id')
            ->value('numero_comprobante');

        $n = $ultimo ? ((int) $ultimo) + 1 : 1;
        return str_pad((string) $n, 7, '0', STR_PAD_LEFT);
    }
}
