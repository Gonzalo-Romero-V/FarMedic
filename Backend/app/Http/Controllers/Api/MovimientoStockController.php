<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lote;
use App\Models\MovimientoStock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Kardex: append-only. Solo index + show + store.
 * No update, no destroy — inmutable por contrato.
 * store() solo acepta tipos manuales: ajuste, devolucion_*, perdida, vencimiento.
 * Los tipos 'venta' e 'ingreso' se generan automáticamente por VentaController y LoteController.
 */
class MovimientoStockController extends Controller
{
    public function index(Request $request)
    {
        $q = MovimientoStock::with(['lote.medicamento', 'usuario']);
        if ($request->filled('lote_id')) {
            $q->where('lote_id', $request->lote_id);
        }
        if ($request->filled('sucursal_id')) {
            $q->where('sucursal_id', $request->sucursal_id);
        }
        if ($request->filled('tipo')) {
            $q->where('tipo', $request->tipo);
        }
        return $q->orderByDesc('created_at')->paginate($request->integer('per_page', 50));
    }

    public function show(MovimientoStock $movimientoStock)
    {
        return $movimientoStock->load(['lote.medicamento', 'usuario', 'referencia']);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'lote_id' => ['required', 'exists:lotes,id'],
            'usuario_id' => ['required', 'exists:usuarios,id'],
            'tipo' => ['required', 'in:ajuste,devolucion_cliente,devolucion_proveedor,vencimiento,perdida'],
            'cantidad' => ['required', 'integer', 'not_in:0'],
            'justificacion' => ['required_if:tipo,ajuste,perdida', 'nullable', 'string'],
        ]);

        return DB::transaction(function () use ($validated) {
            $lote = Lote::lockForUpdate()->findOrFail($validated['lote_id']);

            $nuevaCantidad = $lote->cantidad_actual + $validated['cantidad'];
            if ($nuevaCantidad < 0) {
                abort(422, "Stock insuficiente. Actual: {$lote->cantidad_actual}, ajuste: {$validated['cantidad']}");
            }

            $mov = MovimientoStock::create([
                'lote_id' => $lote->id,
                'sucursal_id' => $lote->sucursal_id,
                'usuario_id' => $validated['usuario_id'],
                'tipo' => $validated['tipo'],
                'cantidad' => $validated['cantidad'],
                'justificacion' => $validated['justificacion'] ?? null,
            ]);

            $lote->cantidad_actual = $nuevaCantidad;
            $lote->save();

            return $mov->load('lote');
        });
    }
}
