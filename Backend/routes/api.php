<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoriaController;
use App\Http\Controllers\Api\ClienteController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EmpleadoController;
use App\Http\Controllers\Api\FarmaciaController;
use App\Http\Controllers\Api\InventarioController;
use App\Http\Controllers\Api\LoteController;
use App\Http\Controllers\Api\MedicamentoController;
use App\Http\Controllers\Api\MovimientoStockController;
use App\Http\Controllers\Api\PedidoController;
use App\Http\Controllers\Api\PosController;
use App\Http\Controllers\Api\ProveedorController;
use App\Http\Controllers\Api\RecetaController;
use App\Http\Controllers\Api\ReportesController;
use App\Http\Controllers\Api\RolController;
use App\Http\Controllers\Api\SucursalController;
use App\Http\Controllers\Api\UsuarioController;
use App\Http\Controllers\Api\VentaController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — protección por capas
|--------------------------------------------------------------------------
| Públicas: catálogo de lectura (RF-09), roles, auth.
| auth:sanctum: requiere Bearer token válido.
| role:admin / role:admin,empleado: además del token, exige rol específico.
| Matriz completa: vault/decisions/api-contracts.md
*/

// ============== PÚBLICAS ==============
Route::get('auth/login', fn () => response()->json(['message' => 'No autenticado'], 401))->name('login');
Route::post('auth/login', [AuthController::class, 'login']);
Route::post('auth/register/cliente', [AuthController::class, 'registerCliente']);

Route::get('roles', [RolController::class, 'index']);
Route::get('farmacia', [FarmaciaController::class, 'show']);

Route::get('sucursales', [SucursalController::class, 'index']);
Route::get('categorias', [CategoriaController::class, 'index']);
Route::get('categorias/{categoria}', [CategoriaController::class, 'show']);
Route::get('medicamentos', [MedicamentoController::class, 'index']);
Route::get('medicamentos/{medicamento}', [MedicamentoController::class, 'show']);

// ============== REQUIERE TOKEN (cualquier rol activo) ==============
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn (Request $r) => $r->user()->load('rol', 'sucursal'));
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

    Route::get('sucursales/{sucursal}', [SucursalController::class, 'show']);

    // Recetas: cualquier autenticado puede subirla (cliente para su pedido, empleado para POS)
    Route::post('recetas', [RecetaController::class, 'store']);
    Route::get('recetas/{receta}', [RecetaController::class, 'show']);

    // Pedidos: lista/show con filtrado por rol en controller; cliente solo crea sus pedidos
    Route::get('pedidos', [PedidoController::class, 'index']);
    Route::get('pedidos/{pedido}', [PedidoController::class, 'show']);
    Route::post('pedidos', [PedidoController::class, 'store']);

    // Cliente — dashboard + catálogo navegable + stock por sucursal. dashboard hace
    // abort_unless(esCliente()) en el controller; catalogo/stock son consultables por
    // cualquier autenticado (admin/empleado pueden ver la vista cliente sin friction).
    Route::get('cliente/dashboard', [ClienteController::class, 'dashboard']);
    Route::get('cliente/catalogo', [ClienteController::class, 'catalogo']);
    Route::get('cliente/medicamentos/{medicamento}/stock-por-sucursal', [ClienteController::class, 'stockPorSucursal']);

    // Usuario: show de sí mismo + update (admin o self — refinar con policy)
    Route::get('usuarios/{usuario}', [UsuarioController::class, 'show']);
    Route::put('usuarios/{usuario}', [UsuarioController::class, 'update']);
});

// ============== ADMIN + EMPLEADO ==============
Route::middleware(['auth:sanctum', 'role:administrador,empleado'])->group(function () {
    // Inventario y Kardex
    Route::get('lotes', [LoteController::class, 'index']);
    Route::get('lotes/{lote}', [LoteController::class, 'show']);
    Route::post('lotes', [LoteController::class, 'store']);
    Route::put('lotes/{lote}', [LoteController::class, 'update']);

    Route::get('movimientos-stock', [MovimientoStockController::class, 'index']);
    Route::get('movimientos-stock/{movimientoStock}', [MovimientoStockController::class, 'show']);
    Route::post('movimientos-stock', [MovimientoStockController::class, 'store']);

    // POS — Búsqueda liviana (medicamentos en sucursal del user + clientes)
    Route::get('pos/medicamentos', [PosController::class, 'medicamentos']);
    Route::get('pos/clientes', [PosController::class, 'clientes']);

    // Empleado — dashboards y módulos locales (filtrados por su sucursal en backend)
    Route::get('empleado/dashboard', [EmpleadoController::class, 'dashboard']);
    Route::get('empleado/inventario/medicamentos', [EmpleadoController::class, 'inventarioMedicamentos']);
    Route::get('empleado/clientes', [EmpleadoController::class, 'clientes']);
    Route::get('empleado/clientes/{id}', [EmpleadoController::class, 'clienteDetalle']);

    // POS — Ventas (alta y consulta)
    Route::get('ventas', [VentaController::class, 'index']);
    Route::get('ventas/{venta}', [VentaController::class, 'show']);
    Route::post('ventas', [VentaController::class, 'store']);

    // Pedidos — gestión de estado
    Route::patch('pedidos/{pedido}/estado', [PedidoController::class, 'cambiarEstado']);

    // Proveedores — lectura
    Route::get('proveedores', [ProveedorController::class, 'index']);
    Route::get('proveedores/{proveedor}', [ProveedorController::class, 'show']);
});

// ============== ADMIN ONLY ==============
Route::middleware(['auth:sanctum', 'role:administrador'])->group(function () {
    // Dashboard agregado (KPIs + secciones para Frontend/app/(private)/admin/dashboard)
    Route::get('admin/dashboard', [DashboardController::class, 'admin']);

    // Inventario admin — overview + vista de stock por medicamento
    Route::get('admin/inventario/overview', [InventarioController::class, 'overview']);
    Route::get('admin/inventario/medicamentos', [InventarioController::class, 'medicamentos']);

    // Farmacia (config global)
    Route::put('farmacia/{farmacia}', [FarmaciaController::class, 'update']);

    // Sucursales (escritura)
    Route::post('sucursales', [SucursalController::class, 'store']);
    Route::put('sucursales/{sucursal}', [SucursalController::class, 'update']);
    Route::delete('sucursales/{sucursal}', [SucursalController::class, 'destroy']);

    // Usuarios (gestión: listar, crear empleados/admins, desactivar)
    Route::get('usuarios', [UsuarioController::class, 'index']);
    Route::post('usuarios', [UsuarioController::class, 'store']);
    Route::delete('usuarios/{usuario}', [UsuarioController::class, 'destroy']);
    Route::patch('usuarios/{usuario}/rol', [UsuarioController::class, 'cambiarRol']);

    // Categorías (escritura)
    Route::post('categorias', [CategoriaController::class, 'store']);
    Route::put('categorias/{categoria}', [CategoriaController::class, 'update']);
    Route::delete('categorias/{categoria}', [CategoriaController::class, 'destroy']);

    // Proveedores (escritura + restore)
    Route::post('proveedores', [ProveedorController::class, 'store']);
    Route::put('proveedores/{proveedor}', [ProveedorController::class, 'update']);
    Route::delete('proveedores/{proveedor}', [ProveedorController::class, 'destroy']);
    Route::post('proveedores/{id}/restore', [ProveedorController::class, 'restore']);

    // Medicamentos (escritura + restore — precio RNF-03 solo admin)
    Route::post('medicamentos', [MedicamentoController::class, 'store']);
    Route::put('medicamentos/{medicamento}', [MedicamentoController::class, 'update']);
    Route::delete('medicamentos/{medicamento}', [MedicamentoController::class, 'destroy']);
    Route::post('medicamentos/{id}/restore', [MedicamentoController::class, 'restore']);

    // Anular venta (solo admin)
    Route::post('ventas/{venta}/anular', [VentaController::class, 'anular']);

    // Ajuste manual de stock (solo admin — corrección administrativa, no operación
    // del flujo de venta/recepción). Split de ruta vs /movimientos-stock estándar.
    Route::post('movimientos-stock/ajuste', [MovimientoStockController::class, 'ajustar']);

    // Reportes mensuales (RNF-03 — admin-only). JSON preview + descarga PDF.
    Route::get('admin/reportes/mensual', [ReportesController::class, 'mensual']);
    Route::get('admin/reportes/mensual.pdf', [ReportesController::class, 'mensualPdf']);
});
