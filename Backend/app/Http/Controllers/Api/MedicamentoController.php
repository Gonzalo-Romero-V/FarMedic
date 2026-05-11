<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medicamento;
use Illuminate\Http\Request;

/**
 * Medicamento con softDeletes — preserva historial de ventas pasadas tras dar de baja.
 * Búsqueda multi-canal (RF-05): nombre, principio_activo, codigo_barras.
 */
class MedicamentoController extends Controller
{
    public function index(Request $request)
    {
        $q = Medicamento::with(['categoria', 'proveedor']);

        if ($request->filled('sucursal_id')) {
            $q->where('sucursal_id', $request->sucursal_id);
        }
        if ($request->filled('categoria_id')) {
            $q->where('categoria_id', $request->categoria_id);
        }
        if ($request->filled('q')) {
            $search = $request->q;
            $q->where(function ($w) use ($search) {
                $w->where('nombre_comercial', 'ilike', "%{$search}%")
                  ->orWhere('principio_activo', 'ilike', "%{$search}%")
                  ->orWhere('codigo_barras', $search);
            });
        }
        if ($request->boolean('solo_activos', true)) {
            $q->where('activo', true);
        }
        if ($request->boolean('incluir_eliminados')) {
            $q->withTrashed();
        }

        // Stock crítico (RF-14): medicamentos con suma de cantidad_actual < stock_minimo
        if ($request->boolean('stock_critico')) {
            $q->whereRaw('stock_minimo > (SELECT COALESCE(SUM(cantidad_actual), 0) FROM lotes WHERE lotes.medicamento_id = medicamentos.id)');
        }

        return $q->orderBy('nombre_comercial')->paginate($request->integer('per_page', 25));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sucursal_id' => ['required', 'exists:sucursales,id'],
            'categoria_id' => ['required', 'exists:categorias,id'],
            'proveedor_id' => ['required', 'exists:proveedores,id'],
            'nombre_comercial' => ['required', 'string', 'max:255'],
            'principio_activo' => ['required', 'string', 'max:255'],
            'codigo_barras' => ['nullable', 'string', 'max:100'],
            'precio' => ['required', 'numeric', 'min:0'],
            'stock_minimo' => ['required', 'integer', 'min:0'],
            'ubicacion_fisica' => ['required', 'string', 'max:100'],
            'requiere_receta' => ['boolean'],
            'activo' => ['boolean'],
        ]);
        return Medicamento::create($validated);
    }

    public function show(Medicamento $medicamento)
    {
        return $medicamento->load(['categoria', 'proveedor', 'sucursal', 'lotes']);
    }

    public function update(Request $request, Medicamento $medicamento)
    {
        $validated = $request->validate([
            'categoria_id' => ['sometimes', 'exists:categorias,id'],
            'proveedor_id' => ['sometimes', 'exists:proveedores,id'],
            'nombre_comercial' => ['sometimes', 'string', 'max:255'],
            'principio_activo' => ['sometimes', 'string', 'max:255'],
            'codigo_barras' => ['sometimes', 'nullable', 'string', 'max:100'],
            'precio' => ['sometimes', 'numeric', 'min:0'],
            'stock_minimo' => ['sometimes', 'integer', 'min:0'],
            'ubicacion_fisica' => ['sometimes', 'string', 'max:100'],
            'requiere_receta' => ['sometimes', 'boolean'],
            'activo' => ['sometimes', 'boolean'],
        ]);
        $medicamento->update($validated);
        return $medicamento;
    }

    public function destroy(Medicamento $medicamento)
    {
        $medicamento->delete();  // soft
        return response()->noContent();
    }

    public function restore(int $id)
    {
        $medicamento = Medicamento::withTrashed()->findOrFail($id);
        $medicamento->restore();
        return $medicamento;
    }
}
