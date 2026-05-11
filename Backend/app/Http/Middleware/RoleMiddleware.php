<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        if (! $user->activo) {
            return response()->json(['message' => 'Usuario inactivo'], 403);
        }

        if (! $user->relationLoaded('rol')) {
            $user->load('rol');
        }

        if (! in_array($user->rol?->nombre, $roles, true)) {
            return response()->json([
                'message' => 'No autorizado para esta acción',
                'roles_requeridos' => $roles,
            ], 403);
        }

        return $next($request);
    }
}
