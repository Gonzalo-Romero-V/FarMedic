<?php

use App\Http\Controllers\Api\CategoriaController;
use App\Http\Controllers\Api\FarmaciaController;
use App\Http\Controllers\Api\LoteController;
use App\Http\Controllers\Api\MedicamentoController;
use App\Http\Controllers\Api\MovimientoStockController;
use App\Http\Controllers\Api\PedidoController;
use App\Http\Controllers\Api\ProveedorController;
use App\Http\Controllers\Api\RecetaController;
use App\Http\Controllers\Api\RolController;
use App\Http\Controllers\Api\SucursalController;
use App\Http\Controllers\Api\UsuarioController;
use App\Http\Controllers\Api\VentaController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// --- Auth helper ---
Route::get('/user', fn (Request $r) => $r->user())->middleware('auth:sanctum');

// --- Roles (readonly) ---
Route::get('roles', [RolController::class, 'index']);

// --- Farmacia (singleton) ---
Route::get('farmacia', [FarmaciaController::class, 'show']);
Route::put('farmacia/{farmacia}', [FarmaciaController::class, 'update']);

// --- Catálogo ---
Route::apiResource('sucursales', SucursalController::class)->parameters(['sucursales' => 'sucursal']);
Route::apiResource('usuarios', UsuarioController::class);
Route::apiResource('categorias', CategoriaController::class);

Route::apiResource('proveedores', ProveedorController::class)->parameters(['proveedores' => 'proveedor']);
Route::post('proveedores/{id}/restore', [ProveedorController::class, 'restore']);

Route::apiResource('medicamentos', MedicamentoController::class);
Route::post('medicamentos/{id}/restore', [MedicamentoController::class, 'restore']);

// --- Inventario y Kardex ---
Route::apiResource('lotes', LoteController::class);
Route::get('movimientos-stock', [MovimientoStockController::class, 'index']);
Route::get('movimientos-stock/{movimientoStock}', [MovimientoStockController::class, 'show']);
Route::post('movimientos-stock', [MovimientoStockController::class, 'store']);

// --- Recetas ---
Route::post('recetas', [RecetaController::class, 'store']);
Route::get('recetas/{receta}', [RecetaController::class, 'show']);

// --- Operaciones ---
Route::apiResource('ventas', VentaController::class)->only(['index', 'show', 'store']);
Route::post('ventas/{venta}/anular', [VentaController::class, 'anular']);

Route::apiResource('pedidos', PedidoController::class)->only(['index', 'show', 'store']);
Route::patch('pedidos/{pedido}/estado', [PedidoController::class, 'cambiarEstado']);
