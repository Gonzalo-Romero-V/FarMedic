<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * RS-04. Rechaza (401) toda petición autenticada de un usuario desactivado, aunque su
 * token siga existiendo. Va después de `auth:sanctum` en todos los grupos autenticados.
 */
class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->activo) {
            return response()->json(['message' => 'Usuario inactivo'], 401);
        }

        return $next($request);
    }
}
