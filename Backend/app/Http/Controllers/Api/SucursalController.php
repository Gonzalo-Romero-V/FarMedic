<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sucursal;
use Illuminate\Http\Request;

/**
 * Sucursales no se eliminan físicamente (referencias en ventas/pedidos/lotes).
 * destroy() hace soft-deactivation con activa=false.
 */
class SucursalController extends Controller
{
    public function index(Request $request)
    {
        $q = Sucursal::with('farmacia');
        if ($request->boolean('solo_activas', true)) {
            $q->where('activa', true);
        }
        if ($request->filled('ciudad')) {
            $q->where('ciudad', $request->ciudad);
        }
        return $q->orderBy('nombre')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'farmacia_id' => ['required', 'exists:farmacias,id'],
            'nombre' => ['required', 'string', 'max:255'],
            'ciudad' => ['required', 'string', 'max:100'],
            'direccion' => ['required', 'string', 'max:255'],
            'telefono' => ['required', 'string', 'max:50'],
            'activa' => ['boolean'],
        ]);
        return Sucursal::create($validated);
    }

    public function show(Sucursal $sucursal)
    {
        return $sucursal->load('farmacia', 'usuarios.rol');
    }

    public function update(Request $request, Sucursal $sucursal)
    {
        $validated = $request->validate([
            'nombre' => ['sometimes', 'string', 'max:255'],
            'ciudad' => ['sometimes', 'string', 'max:100'],
            'direccion' => ['sometimes', 'string', 'max:255'],
            'telefono' => ['sometimes', 'string', 'max:50'],
            'activa' => ['sometimes', 'boolean'],
        ]);
        $sucursal->update($validated);
        return $sucursal;
    }

    public function destroy(Sucursal $sucursal)
    {
        // Soft-deactivation: nunca eliminamos físicamente (preserva FKs históricas).
        $sucursal->update(['activa' => false]);
        return response()->noContent();
    }
}
