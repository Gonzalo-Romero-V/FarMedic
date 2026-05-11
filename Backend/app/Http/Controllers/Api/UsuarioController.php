<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * Maneja TODOS los usuarios (admin, empleado, cliente) que viven en tabla `usuarios`.
 * - Filtros por rol via ?rol=administrador|empleado|cliente
 * - destroy() hace soft-deactivation con activo=false (preserva ventas/pedidos asociados).
 */
class UsuarioController extends Controller
{
    public function index(Request $request)
    {
        $q = Usuario::with(['rol', 'sucursal']);
        if ($request->filled('rol')) {
            $q->whereHas('rol', fn ($r) => $r->where('nombre', $request->rol));
        }
        if ($request->filled('sucursal_id')) {
            $q->where('sucursal_id', $request->sucursal_id);
        }
        if ($request->boolean('solo_activos', true)) {
            $q->where('activo', true);
        }
        return $q->orderBy('nombre')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'rol_id' => ['required', 'exists:roles,id'],
            'sucursal_id' => ['nullable', 'exists:sucursales,id'],
            'nombre' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:usuarios,email'],
            'password' => ['required', 'string', 'min:8'],
            'telefono' => ['nullable', 'string', 'max:50'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'google_oauth_id' => ['nullable', 'string', 'unique:usuarios,google_oauth_id'],
        ]);

        // Regla: si rol es admin o empleado → sucursal_id obligatoria
        $rol = Rol::find($validated['rol_id']);
        if (in_array($rol->nombre, ['administrador', 'empleado']) && empty($validated['sucursal_id'])) {
            return response()->json([
                'message' => 'sucursal_id requerida para roles administrador y empleado',
            ], 422);
        }
        // Regla: cliente NO tiene sucursal
        if ($rol->nombre === 'cliente' && !empty($validated['sucursal_id'])) {
            $validated['sucursal_id'] = null;
        }

        $validated['password'] = Hash::make($validated['password']);
        $usuario = Usuario::create($validated);
        return $usuario->load('rol', 'sucursal');
    }

    public function show(Usuario $usuario)
    {
        return $usuario->load('rol', 'sucursal');
    }

    public function update(Request $request, Usuario $usuario)
    {
        $validated = $request->validate([
            'nombre' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', 'unique:usuarios,email,' . $usuario->id],
            'password' => ['sometimes', 'string', 'min:8'],
            'telefono' => ['sometimes', 'nullable', 'string', 'max:50'],
            'direccion' => ['sometimes', 'nullable', 'string', 'max:255'],
            'sucursal_id' => ['sometimes', 'nullable', 'exists:sucursales,id'],
            'activo' => ['sometimes', 'boolean'],
        ]);
        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }
        // Cambio de rol requiere endpoint separado o admin con permisos especiales (no expuesto aquí).
        $usuario->update($validated);
        return $usuario->load('rol', 'sucursal');
    }

    public function destroy(Usuario $usuario)
    {
        // Soft-deactivation. No se elimina físicamente para preservar ventas/pedidos históricos.
        $usuario->update(['activo' => false]);
        return response()->noContent();
    }
}
