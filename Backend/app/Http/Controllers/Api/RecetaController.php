<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Receta;
use Illuminate\Http\Request;

/**
 * Recetas son metadata + opcionalmente una imagen. Solo create + show — una vez creadas
 * no se editan ni eliminan (referencia inmutable para Venta/Pedido).
 */
class RecetaController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'numero' => ['nullable', 'string', 'max:100'],
            'imagen_url' => ['nullable', 'string', 'max:255'],
            'doctor' => ['nullable', 'string', 'max:255'],
            'fecha_emision' => ['nullable', 'date'],
            'observaciones' => ['nullable', 'string'],
        ]);

        if (empty($validated['numero']) && empty($validated['imagen_url'])) {
            abort(422, 'Debe proveer numero o imagen_url');
        }

        return Receta::create($validated);
    }

    public function show(Receta $receta)
    {
        return $receta->load(['venta', 'pedido']);
    }
}
