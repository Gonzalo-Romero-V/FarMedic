<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Receta;
use Illuminate\Http\Request;

/**
 * Recetas son metadata + opcionalmente una imagen. Solo create + show — una vez creadas
 * no se editan ni eliminan (referencia inmutable para Venta/Pedido).
 *
 * El archivo se guarda en storage/app/private/recetas/ (no público). imagen_url
 * almacena el path relativo bajo ese directorio (domain/receta.md).
 */
class RecetaController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'numero' => ['nullable', 'string', 'max:100'],
            'imagen' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
            'doctor' => ['nullable', 'string', 'max:255'],
            'fecha_emision' => ['nullable', 'date'],
            'observaciones' => ['nullable', 'string'],
        ]);

        if (empty($validated['numero']) && !$request->hasFile('imagen')) {
            abort(422, 'Debe proveer numero o imagen');
        }

        $imagenPath = null;
        if ($request->hasFile('imagen')) {
            $imagenPath = $request->file('imagen')->store('recetas', 'local');
        }

        return Receta::create([
            'numero' => $validated['numero'] ?? null,
            'imagen_url' => $imagenPath,
            'doctor' => $validated['doctor'] ?? null,
            'fecha_emision' => $validated['fecha_emision'] ?? null,
            'observaciones' => $validated['observaciones'] ?? null,
        ]);
    }

    public function show(Receta $receta)
    {
        return $receta->load(['venta', 'pedido']);
    }
}
