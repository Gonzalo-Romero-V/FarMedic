<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;

/**
 * Categorías sin estado activo/inactivo. Eliminación es hard delete pero FK restrict
 * impide borrar si hay medicamentos asociados (vault: categoria.md).
 */
class CategoriaController extends Controller
{
    public function index()
    {
        return Categoria::orderBy('nombre')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:255', 'unique:categorias,nombre'],
            'descripcion' => ['nullable', 'string'],
        ]);
        return Categoria::create($validated);
    }

    public function show(Categoria $categoria)
    {
        return $categoria->loadCount('medicamentos');
    }

    public function update(Request $request, Categoria $categoria)
    {
        $validated = $request->validate([
            'nombre' => ['sometimes', 'string', 'max:255', 'unique:categorias,nombre,' . $categoria->id],
            'descripcion' => ['sometimes', 'nullable', 'string'],
        ]);
        $categoria->update($validated);
        return $categoria;
    }

    public function destroy(Categoria $categoria)
    {
        try {
            $categoria->delete();
            return response()->noContent();
        } catch (QueryException $e) {
            return response()->json([
                'message' => 'No se puede eliminar: categoría tiene medicamentos asociados',
            ], 409);
        }
    }
}
