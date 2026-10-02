<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContactoEntregaResource;
use App\Models\Rol;
use App\Models\Usuario;
use App\Rules\ContrasenaSegura;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
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
            'password' => ['required', 'string', new ContrasenaSegura],
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

    /**
     * RS-02. Administrador y propietario: registro completo. Empleado: solo
     * nombre/teléfono/dirección de un cliente con pedido activo a domicilio en su
     * sucursal. Cualquier otro caso → 403.
     */
    public function show(Request $request, Usuario $usuario)
    {
        $actor = $request->user();

        if (Gate::forUser($actor)->allows('view', $usuario)) {
            return $usuario->load('rol', 'sucursal');
        }

        Gate::forUser($actor)->authorize('verContactoEntrega', $usuario);

        return new ContactoEntregaResource($usuario);
    }

    /**
     * RS-01. Administrador: edita cualquier usuario, y la contraseña solo de otros
     * (la propia va por /auth/me/password). Propietario no administrador: solo su
     * registro y solo nombre, teléfono y dirección (esta última solo cliente);
     * cualquier intento de tocar correo, contraseña, sucursal, rol o estado → 403.
     */
    public function update(Request $request, Usuario $usuario)
    {
        Gate::authorize('update', $usuario);

        $actor = $request->user();

        $rules = [
            'nombre' => ['sometimes', 'string', 'max:255'],
            'telefono' => ['sometimes', 'nullable', 'string', 'max:50'],
            'direccion' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];

        if ($actor->esAdministrador()) {
            $rules += [
                'email' => ['sometimes', 'email', 'max:255', 'unique:usuarios,email,' . $usuario->id],
                'password' => ['sometimes', 'string', new ContrasenaSegura],
                'sucursal_id' => ['sometimes', 'nullable', 'exists:sucursales,id'],
                'activo' => ['sometimes', 'boolean'],
            ];
            abort_if(
                $request->has('password') && $actor->id === $usuario->id,
                403,
                'La contraseña propia se cambia en /api/auth/me/password'
            );
        } else {
            $prohibidos = array_values(array_intersect(
                ['email', 'password', 'sucursal_id', 'rol_id', 'activo'],
                array_keys($request->all())
            ));
            abort_if($prohibidos !== [], 403, 'Campos reservados al administrador: ' . implode(', ', $prohibidos));
            if (! $actor->esCliente()) {
                unset($rules['direccion']);
            }
        }

        $validated = $request->validate($rules);
        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }
        $desactiva = ($validated['activo'] ?? true) === false;
        if ($desactiva) {
            $this->protegerUltimoAdmin($usuario);
        }

        // Cambio de rol: endpoint separado (PATCH /usuarios/{usuario}/rol, solo admin).
        $usuario->update($validated);
        if ($desactiva) {
            $usuario->tokens()->delete(); // RS-04: desactivar revoca todos sus tokens
        }
        return $usuario->load('rol', 'sucursal');
    }

    public function destroy(Usuario $usuario)
    {
        // Soft-deactivation. No se elimina físicamente para preservar ventas/pedidos históricos.
        $this->protegerUltimoAdmin($usuario);
        $usuario->update(['activo' => false]);
        $usuario->tokens()->delete(); // RS-04: desactivar revoca todos sus tokens
        return response()->noContent();
    }

    /**
     * RS-05. No se puede desactivar al último administrador activo (422). Mismo criterio
     * que cambiarRol(); se aplica a todos los caminos que desactivan (DELETE y PUT activo=false).
     */
    private function protegerUltimoAdmin(Usuario $usuario): void
    {
        if (! $usuario->activo || ! $usuario->esAdministrador()) {
            return;
        }

        $otrosAdmins = Usuario::administradores()
            ->where('activo', true)
            ->where('id', '!=', $usuario->id)
            ->count();
        abort_if($otrosAdmins === 0, 422, 'No se puede desactivar: es el último admin activo');
    }

    /**
     * Cambio de rol explícito (admin-only por ruta).
     *
     * Reglas (domain/usuario.md + intent/roles.md):
     *   - administrador/empleado exigen `sucursal_id`. cliente la limpia (siempre NULL).
     *   - No se puede dejar al sistema sin administradores activos: si el usuario
     *     era admin y la operación lo saca de admin, debe haber al menos otro admin
     *     activo distinto.
     */
    public function cambiarRol(Request $request, Usuario $usuario)
    {
        $validated = $request->validate([
            'rol_id' => ['required', 'exists:roles,id'],
            'sucursal_id' => ['nullable', 'exists:sucursales,id'],
        ]);

        $rolNuevo = Rol::findOrFail($validated['rol_id']);
        $rolActual = $usuario->rol;

        if (in_array($rolNuevo->nombre, ['administrador', 'empleado']) && empty($validated['sucursal_id'])) {
            abort(422, "sucursal_id es obligatoria para rol {$rolNuevo->nombre}");
        }

        // Si el usuario es admin y la operación lo saca de admin, garantizar que
        // queda al menos otro admin activo distinto.
        if ($rolActual?->nombre === 'administrador' && $rolNuevo->nombre !== 'administrador') {
            $otrosAdmins = Usuario::administradores()
                ->where('activo', true)
                ->where('id', '!=', $usuario->id)
                ->count();
            abort_if($otrosAdmins === 0, 422, 'No se puede quitar el rol administrador: es el último admin activo');
        }

        $updates = ['rol_id' => $rolNuevo->id];
        if ($rolNuevo->nombre === 'cliente') {
            $updates['sucursal_id'] = null;
        } elseif (!empty($validated['sucursal_id'])) {
            $updates['sucursal_id'] = $validated['sucursal_id'];
        }

        $usuario->update($updates);
        return $usuario->load('rol', 'sucursal');
    }
}
