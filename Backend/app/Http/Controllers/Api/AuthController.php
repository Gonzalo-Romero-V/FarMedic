<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;

/**
 * Auth — login tradicional, registro de cliente, logout, OAuth Google.
 * Devuelve siempre { user, token } con token Bearer de Sanctum.
 */
class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $usuario = Usuario::with('rol', 'sucursal')->where('email', $credentials['email'])->first();

        if (! $usuario || ! Hash::check($credentials['password'], $usuario->password)) {
            throw ValidationException::withMessages([
                'email' => ['Credenciales inválidas'],
            ])->status(401);
        }

        if (! $usuario->activo) {
            return response()->json(['message' => 'Usuario inactivo'], 403);
        }

        $token = $usuario->createToken('login-traditional')->plainTextToken;

        return response()->json([
            'user' => $usuario,
            'token' => $token,
        ]);
    }

    /**
     * Registro público — siempre crea con rol cliente. Endpoints internos
     * (admin/empleado) los crea un administrador vía POST /api/usuarios.
     */
    public function registerCliente(Request $request)
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:usuarios,email'],
            'password' => ['required', 'string', 'min:8'],
            'telefono' => ['nullable', 'string', 'max:50'],
            'direccion' => ['nullable', 'string', 'max:255'],
        ]);

        $rolCliente = Rol::where('nombre', 'cliente')->firstOrFail();

        $usuario = Usuario::create([
            'rol_id' => $rolCliente->id,
            'sucursal_id' => null,
            'nombre' => $validated['nombre'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'telefono' => $validated['telefono'] ?? null,
            'direccion' => $validated['direccion'] ?? null,
            'activo' => true,
        ]);

        $token = $usuario->createToken('register-cliente')->plainTextToken;

        return response()->json([
            'user' => $usuario->load('rol', 'sucursal'),
            'token' => $token,
        ], 201);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->noContent();
    }

    public function me(Request $request)
    {
        return $request->user()->load('rol', 'sucursal');
    }

    /**
     * Inicio del flujo OAuth — redirige al consent de Google.
     * Vive en web.php (no /api) porque Google nos devuelve por HTTP 302.
     */
    public function googleRedirect()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    /**
     * Callback de Google. Resuelve usuario (findOrCreate) y redirige al
     * frontend con el token Bearer en query param.
     */
    public function googleCallback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Throwable $e) {
            \Log::error('Google OAuth user extraction failed: ' . $e->getMessage());
            return redirect(config('services.frontend.url') . '/auth/callback?error=oauth_failed');
        }

        try {
            $rolCliente = Rol::where('nombre', 'cliente')->firstOrFail();

            // Estrategia: matchear por google_oauth_id primero, luego por email.
            $usuario = Usuario::where('google_oauth_id', $googleUser->getId())->first();

            if (! $usuario) {
                $usuario = Usuario::where('email', $googleUser->getEmail())->first();
                if ($usuario) {
                    $usuario->update(['google_oauth_id' => $googleUser->getId()]);
                } else {
                    $usuario = Usuario::create([
                        'rol_id' => $rolCliente->id,
                        'sucursal_id' => null,
                        'nombre' => $googleUser->getName() ?? $googleUser->getNickname() ?? 'Usuario Google',
                        'email' => $googleUser->getEmail(),
                        'password' => Hash::make(Str::random(40)),
                        'google_oauth_id' => $googleUser->getId(),
                        'activo' => true,
                    ]);
                }
            }

            if (! $usuario->activo) {
                return redirect(config('services.frontend.url') . '/auth/callback?error=usuario_inactivo');
            }

            $token = $usuario->createToken('google-oauth')->plainTextToken;

            return redirect(config('services.frontend.url') . '/auth/callback?token=' . urlencode($token));

        } catch (\Throwable $e) {
            \Log::error('Google OAuth callback internal error: ' . $e->getMessage(), [
                'exception' => $e,
                'google_user_email' => $googleUser->getEmail() ?? 'unknown'
            ]);
            return redirect(config('services.frontend.url') . '/auth/callback?error=internal_error');
        }
    }
}
