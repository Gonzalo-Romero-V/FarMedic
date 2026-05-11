<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Farmacia;
use App\Models\Lote;
use App\Models\Medicamento;
use App\Models\MovimientoStock;
use App\Models\Venta;
use App\Models\VentaItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Ventas son inmutables tras confirmar. Solo se permite cambiar estado a 'anulada' (genera
 * movimientos inversos). store() es transaccional: descuenta lotes FEFO + crea items +
 * crea movimientos Kardex tipo='venta'.
 */
class VentaController extends Controller
{
    public function index(Request $request)
    {
        $q = Venta::with(['items.lote.medicamento', 'usuario', 'cliente']);
        if ($request->filled('sucursal_id')) {
            $q->where('sucursal_id', $request->sucursal_id);
        }
        if ($request->filled('estado')) {
            $q->where('estado', $request->estado);
        }
        if ($request->filled('desde')) {
            $q->where('fecha', '>=', $request->desde);
        }
        if ($request->filled('hasta')) {
            $q->where('fecha', '<=', $request->hasta);
        }
        return $q->orderByDesc('fecha')->paginate($request->integer('per_page', 25));
    }

    public function show(Venta $venta)
    {
        return $venta->load(['items.lote.medicamento', 'usuario', 'cliente', 'receta', 'sucursal']);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sucursal_id' => ['required', 'exists:sucursales,id'],
            'usuario_id' => ['required', 'exists:usuarios,id'],
            'cliente_id' => ['nullable', 'exists:usuarios,id'],
            'receta_id' => ['nullable', 'exists:recetas,id'],
            'descuento_total' => ['nullable', 'numeric', 'min:0'],
            'metodo_pago' => ['required', 'in:efectivo,tarjeta,transferencia'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.medicamento_id' => ['required', 'exists:medicamentos,id'],
            'items.*.cantidad' => ['required', 'integer', 'min:1'],
            'items.*.descuento_item' => ['nullable', 'numeric', 'min:0'],
        ]);

        return DB::transaction(function () use ($validated) {
            $sucursalId = $validated['sucursal_id'];
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

            $descuentoTotal = $validated['descuento_total'] ?? 0;
            $base = max(0, $subtotal - $descuentoTotal);
            $impuesto = round($base * ($ivaTasa / 100), 2);
            $total = $base + $impuesto;

            $venta = Venta::create([
                'sucursal_id' => $sucursalId,
                'usuario_id' => $validated['usuario_id'],
                'cliente_id' => $validated['cliente_id'] ?? null,
                'receta_id' => $validated['receta_id'] ?? null,
                'numero_comprobante' => 'V-' . now()->format('YmdHis') . '-' . random_int(100, 999),
                'subtotal' => $subtotal,
                'descuento_total' => $descuentoTotal,
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
                    'usuario_id' => $validated['usuario_id'],
                    'tipo' => 'venta',
                    'cantidad' => -$vi->cantidad,
                    'referencia_tipo' => Venta::class,
                    'referencia_id' => $venta->id,
                ]);
            }

            return $venta->load('items.lote.medicamento');
        });
    }

    /**
     * Anular una venta: revierte stock con movimientos devolucion_cliente.
     */
    public function anular(Request $request, Venta $venta)
    {
        if ($venta->estado === 'anulada') {
            abort(409, 'Venta ya anulada');
        }

        $validated = $request->validate([
            'usuario_id' => ['required', 'exists:usuarios,id'],
            'justificacion' => ['required', 'string'],
        ]);

        return DB::transaction(function () use ($venta, $validated) {
            foreach ($venta->items as $item) {
                $lote = $item->lote()->lockForUpdate()->first();
                $lote->cantidad_actual += $item->cantidad;
                $lote->save();

                MovimientoStock::create([
                    'lote_id' => $item->lote_id,
                    'sucursal_id' => $venta->sucursal_id,
                    'usuario_id' => $validated['usuario_id'],
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
}
