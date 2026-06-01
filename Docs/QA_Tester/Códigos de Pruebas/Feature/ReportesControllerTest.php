<?php

namespace Tests\Feature;

use App\Models\Farmacia;
use App\Models\Lote;
use App\Models\Medicamento;
use App\Models\Rol;
use App\Models\Sucursal;
use App\Models\Usuario;
use App\Models\Venta;
use App\Models\VentaItem;
use App\Models\Categoria;
use App\Models\Proveedor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReportesControllerTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;
    protected $sucursal;
    protected $medicamento;
    protected $proveedor;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Configurar roles básicos
        DB::table('roles')->delete();
        DB::table('roles')->insert([
            ['id' => 1, 'nombre' => 'administrador', 'descripcion' => 'Admin', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'nombre' => 'empleado', 'descripcion' => 'Empleado', 'created_at' => now(), 'updated_at' => now()],
        ]);

        $farmacia = Farmacia::create([
            'ruc' => '1791234567001',
            'nombre' => 'FarMedic Test',
            'iva_tasa' => 15.00,
            'telefono_contacto' => '0999999999',
            'email_contacto' => 'test@farmedic.local'
        ]);

        $this->sucursal = Sucursal::create([
            'farmacia_id' => $farmacia->id,
            'nombre' => 'Sucursal Central',
            'ciudad' => 'Riobamba',
            'direccion' => 'Av. Daniel Leon',
            'telefono' => '032000000',
            'activa' => true
        ]);

        $this->admin = Usuario::create([
            'rol_id' => 1,
            'sucursal_id' => $this->sucursal->id,
            'nombre' => 'Admin Reportes',
            'email' => 'admin@reportes.com',
            'password' => bcrypt('password'),
            'activo' => true
        ]);

        $categoria = Categoria::create(['nombre' => 'Test Cat', 'descripcion' => 'Desc']);
        $this->proveedor = Proveedor::create(['nombre' => 'Prov', 'ruc' => '1234567890', 'email' => 'p@p.com', 'telefono' => '123']);

        $this->medicamento = Medicamento::create([
            'sucursal_id' => $this->sucursal->id,
            'categoria_id' => $categoria->id,
            'proveedor_id' => $this->proveedor->id,
            'nombre_comercial' => 'Med A',
            'principio_activo' => 'Principio',
            'codigo_barras' => '123',
            'precio' => 10.00,
            'stock_minimo' => 5,
            'ubicacion_fisica' => 'A1',
            'requiere_receta' => false,
            'activo' => true
        ]);
    }

    public function test_reporte_mensual_calcula_totales_correctamente_y_excluye_otros_meses()
    {
        $year = 2026;
        $month = 5;

        // Venta en Mayo 2026 (Debe aparecer)
        $venta1 = Venta::forceCreate([
            'sucursal_id' => $this->sucursal->id,
            'usuario_id' => $this->admin->id,
            'numero_comprobante' => '0000001',
            'subtotal' => 100.00,
            'iva_tasa_aplicada' => 15.00,
            'impuesto_total' => 15.00,
            'total' => 115.00,
            'metodo_pago' => 'efectivo',
            'estado' => 'completada',
            'fecha' => Carbon::create($year, $month, 10)
        ]);

        // Venta en Abril 2026 (No debe aparecer)
        Venta::forceCreate([
            'sucursal_id' => $this->sucursal->id,
            'usuario_id' => $this->admin->id,
            'numero_comprobante' => '0000002',
            'subtotal' => 200.00,
            'iva_tasa_aplicada' => 15.00,
            'impuesto_total' => 30.00,
            'total' => 230.00,
            'metodo_pago' => 'efectivo',
            'estado' => 'completada',
            'fecha' => Carbon::create($year, $month - 1, 10)
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/admin/reportes/mensual?year={$year}&month={$month}");

        $response->assertStatus(200);
        $response->assertJsonPath('periodo.mes_label', 'mayo 2026');
        $response->assertJsonPath('ventas.totalizado.total', "115.00");
        $response->assertJsonPath('ventas.totalizado.cantidad', 1);
    }

    public function test_reporte_mensual_excluye_ventas_anuladas()
    {
        $year = 2026;
        $month = 6;

        // Venta Completada
        Venta::forceCreate([
            'sucursal_id' => $this->sucursal->id,
            'usuario_id' => $this->admin->id,
            'numero_comprobante' => '0000003',
            'subtotal' => 100.00,
            'iva_tasa_aplicada' => 15.00,
            'impuesto_total' => 15.00,
            'total' => 115.00,
            'metodo_pago' => 'efectivo',
            'estado' => 'completada',
            'fecha' => Carbon::create($year, $month, 5)
        ]);

        // Venta Anulada (No debe sumar al total de ingresos)
        Venta::forceCreate([
            'sucursal_id' => $this->sucursal->id,
            'usuario_id' => $this->admin->id,
            'numero_comprobante' => '0000004',
            'subtotal' => 500.00,
            'iva_tasa_aplicada' => 15.00,
            'impuesto_total' => 75.00,
            'total' => 575.00,
            'metodo_pago' => 'efectivo',
            'estado' => 'anulada',
            'fecha' => Carbon::create($year, $month, 6)
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/admin/reportes/mensual?year={$year}&month={$month}");

        $response->assertStatus(200);
        // El total debe ser solo los 115 de la venta completada
        $response->assertJsonPath('ventas.totalizado.total', "115.00");
        $response->assertJsonPath('ventas.totalizado.cantidad', 1);
    }

    public function test_reporte_mensual_solo_accesible_por_administrador()
    {
        $empleado = Usuario::create([
            'rol_id' => 2,
            'sucursal_id' => $this->sucursal->id,
            'nombre' => 'Empleado Test',
            'email' => 'empleado@test.com',
            'password' => bcrypt('password'),
            'activo' => true
        ]);

        $response = $this->actingAs($empleado, 'sanctum')
            ->getJson("/api/admin/reportes/mensual?year=2026&month=5");

        $response->assertStatus(403);
    }
}
