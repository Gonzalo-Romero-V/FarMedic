<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

/*
| Google OAuth — NO bajo /api porque Google nos devuelve por HTTP 302
| desde el callback registrado en Google Cloud Console:
|   http://localhost:8000/auth/google/callback
| El callback redirige al frontend con ?token=<sanctum>.
*/
Route::get('auth/google/redirect', [AuthController::class, 'googleRedirect']);
Route::get('auth/google/callback', [AuthController::class, 'googleCallback']);
