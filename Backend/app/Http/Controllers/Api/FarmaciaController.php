<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Farmacia;
use Illuminate\Http\Request;

/**
 * Singleton en MVP — una sola Farmacia. Solo show + update.
 */
class FarmaciaController extends Controller
{
    public function show()
    {
        return Farmacia::with('sucursales')->firstOrFail();
    }

    public function update(Request $request, Farmacia $farmacia)
    {
        $validated = $request->validate([
            'nombre' => ['sometimes', 'string', 'max:255'],
            'ruc' => ['sometimes', 'string', 'max:20', 'unique:farmacias,ruc,' . $farmacia->id],
            'logo_url' => ['sometimes', 'nullable', 'string'],
            'iva_tasa' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'telefono_contacto' => ['sometimes', 'string', 'max:50'],
            'email_contacto' => ['sometimes', 'email', 'max:255'],
        ]);

        $farmacia->update($validated);
        return $farmacia;
    }
}
