<?php

namespace App\Support;

use App\Models\EventoSeguridad;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Throwable;

/**
 * RS-15. Punto único para registrar eventos de seguridad. Recibe solo datos ya
 * saneados (acción, resultado, actores, texto corto): nunca el cuerpo de la petición,
 * contraseñas ni tokens. Un fallo al escribir no interrumpe la petición.
 */
class BitacoraSeguridad
{
    public const LOGIN = 'login';
    public const LOGOUT = 'logout';
    public const CAMBIO_CONTRASENA = 'cambio_contrasena';
    public const CAMBIO_ROL = 'cambio_rol';
    public const DESACTIVACION = 'desactivacion';
    public const ACCESO_DENEGADO = 'acceso_denegado';

    public const EXITOSO = 'exitoso';
    public const FALLIDO = 'fallido';
    public const BLOQUEADO = 'bloqueado';
    public const DENEGADO = 'denegado';

    public static function registrar(
        string $accion,
        string $resultado,
        ?Usuario $usuario,
        ?Request $request = null,
        ?Usuario $objetivo = null,
        ?string $detalle = null,
    ): void {
        $request ??= request();

        try {
            EventoSeguridad::create([
                'usuario_id' => $usuario?->id,
                'objetivo_id' => $objetivo?->id,
                'accion' => $accion,
                'resultado' => $resultado,
                'ip' => $request->ip(),
                'agente' => mb_substr((string) $request->userAgent(), 0, 255) ?: null,
                'detalle' => $detalle === null ? null : mb_substr($detalle, 0, 255),
            ]);
        } catch (Throwable $e) {
            report($e);
        }
    }

    /** "GET api/usuarios/{usuario}": método y plantilla de la ruta, sin ids, query ni cuerpo. */
    public static function rutaDe(Request $request): string
    {
        return $request->method() . ' ' . ($request->route()?->uri() ?? $request->path());
    }
}
