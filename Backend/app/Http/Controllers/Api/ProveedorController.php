<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Proveedor;
use Illuminate\Http\Request;

/**
 * Proveedor tiene softDeletes — destroy() hace soft delete, restore() lo recupera.
 */
class ProveedorController extends Controller
{
    public function index(Request $request)
    {
        $q = Proveedor::query();
        if ($request->boolean('incluir_eliminados')) {
            $q->withTrashed();
        }
        return $q->orderBy('nombre')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'ruc' => ['nullable', 'string', 'max:20', 'unique:proveedores,ruc'],
            'telefono' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'activo' => ['boolean'],
        ]);
        return Proveedor::create($validated);
    }

    public function show(Proveedor $proveedor)
    {
        return $proveedor->loadCount(['medicamentos', 'lotes']);
    }

    public function update(Request $request, Proveedor $proveedor)
    {
        $validated = $request->validate([
            'nombre' => ['sometimes', 'string', 'max:255'],
            'ruc' => ['sometimes', 'nullable', 'string', 'max:20', 'unique:proveedores,ruc,' . $proveedor->id],
            'telefono' => ['sometimes', 'nullable', 'string', 'max:50'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'direccion' => ['sometimes', 'nullable', 'string', 'max:255'],
            'activo' => ['sometimes', 'boolean'],
        ]);
        $proveedor->update($validated);
        return $proveedor;
    }

    public function destroy(Proveedor $proveedor)
    {
        $proveedor->delete();  // soft
        return response()->noContent();
    }

    public function restore(int $id)
    {
        $proveedor = Proveedor::withTrashed()->findOrFail($id);
        $proveedor->restore();
        return $proveedor;
    }
}
