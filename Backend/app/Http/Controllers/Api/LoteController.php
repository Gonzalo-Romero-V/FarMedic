<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lote;
use App\Models\MovimientoStock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Lote no se elimina (historial inmutable). store() genera atomicamente un
 * MovimientoStock tipo='ingreso' con cantidad_inicial. Actualizaciones son solo de
 * metadatos — cantidad_actual NUNCA se setea directamente (vía Kardex).
 */
class LoteController extends Controller
{
    public function index(Request $request)
    {
        // Eager-load completo para que las tablas del frontend muestren columnas
        // sucursal/categoria sin N+1. medicamento.categoria es N→1, restringimos
        // columnas para no devolver toda la fila.
        $q = Lote::with([
            'medicamento:id,nombre_comercial,principio_activo,categoria_id,stock_minimo,requiere_receta',
            'medicamento.categoria:id,nombre',
            'proveedor:id,nombre',
            'sucursal:id,nombre,ciudad',
        ]);
        if ($request->filled('sucursal_id')) {
            $q->where('sucursal_id', $request->sucursal_id);
        }
        if ($request->filled('medicamento_id')) {
            $q->where('medicamento_id', $request->medicamento_id);
        }
        if ($request->filled('proveedor_id')) {
            $q->where('proveedor_id', $request->proveedor_id);
        }
        // Alertas RF-03: próximo a vencer (30 días) o vencido
        if ($request->filled('estado')) {
            $hoy = now()->toDateString();
            $en30 = now()->addDays(30)->toDateString();
            match ($request->estado) {
                'vencido' => $q->where('fecha_vencimiento', '<', $hoy),
                'proximo_a_vencer' => $q->whereBetween('fecha_vencimiento', [$hoy, $en30]),
                'vigente' => $q->where('fecha_vencimiento', '>', $en30),
                default => null,
            };
        }
        if ($request->boolean('solo_con_stock')) {
            $q->where('cantidad_actual', '>', 0);
        }
        // Búsqueda libre por nombre comercial / principio activo / número de lote
        if ($request->filled('q')) {
            $term = '%' . $request->q . '%';
            $q->where(function ($qq) use ($term) {
                $qq->where('numero_lote', 'ilike', $term)
                    ->orWhereHas('medicamento', function ($m) use ($term) {
                        $m->where('nombre_comercial', 'ilike', $term)
                            ->orWhere('principio_activo', 'ilike', $term);
                    });
            });
        }
        return $q->orderBy('fecha_vencimiento')->paginate($request->integer('per_page', 25));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'medicamento_id' => ['required', 'exists:medicamentos,id'],
            'sucursal_id' => ['required', 'exists:sucursales,id'],
            'proveedor_id' => ['required', 'exists:proveedores,id'],
            'numero_lote' => ['required', 'string', 'max:100'],
            'fecha_vencimiento' => ['required', 'date', 'after:today'],
            'fecha_ingreso' => ['required', 'date'],
            'cantidad_inicial' => ['required', 'integer', 'min:1'],
            'costo_unitario' => ['required', 'numeric', 'min:0'],
            'usuario_id' => ['nullable', 'exists:usuarios,id'],
        ]);

        return DB::transaction(function () use ($validated) {
            // cantidad_actual = cantidad_inicial al crear (asignación directa, no via fillable)
            $lote = new Lote($validated);
            $lote->cantidad_actual = $lote->cantidad_inicial;
            $lote->save();

            // Generar movimiento Kardex de tipo 'ingreso'
            MovimientoStock::create([
                'lote_id' => $lote->id,
                'sucursal_id' => $lote->sucursal_id,
                'usuario_id' => $validated['usuario_id'] ?? null,
                'tipo' => 'ingreso',
                'cantidad' => $lote->cantidad_inicial,
                'referencia_tipo' => 'Proveedor',
                'referencia_id' => $lote->proveedor_id,
                'justificacion' => "Ingreso lote {$lote->numero_lote}",
            ]);

            return $lote->load('medicamento', 'proveedor');
        });
    }

    public function show(Lote $lote)
    {
        return $lote->load(['medicamento', 'proveedor', 'movimientosStock']);
    }

    public function update(Request $request, Lote $lote)
    {
        // Solo metadatos. cantidad_actual y cantidad_inicial NUNCA via update directo.
        $validated = $request->validate([
            'numero_lote' => ['sometimes', 'string', 'max:100'],
            'fecha_vencimiento' => ['sometimes', 'date'],
            'costo_unitario' => ['sometimes', 'numeric', 'min:0'],
        ]);
        $lote->update($validated);
        return $lote;
    }

    public function destroy(Lote $lote)
    {
        // Lotes no se eliminan. Ajustes de cantidad van por MovimientoStock tipo='ajuste'.
        return response()->json([
            'message' => 'Lote es inmutable. Para corregir cantidad use MovimientoStock tipo=ajuste con justificacion.',
        ], 405);
    }
}
