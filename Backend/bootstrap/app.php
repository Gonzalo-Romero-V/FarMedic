<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'activo' => \App\Http\Middleware\EnsureUserIsActive::class,
        ]);

        // IP real del cliente tras el proxy del hosting (la usan los límites de RS-06 y RS-08).
        // Sin TRUSTED_PROXIES no se confía en ningún proxy: $request->ip() es la IP de la conexión.
        // Definirla ('*' o lista de IP/CIDR separadas por coma) solo en un entorno detrás de proxy.
        if ($proxies = env('TRUSTED_PROXIES')) {
            $middleware->trustProxies(at: $proxies === '*' ? '*' : array_map('trim', explode(',', $proxies)));
        }
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
