<?php

namespace Tests\Feature;

use App\Models\Farmacia;
use App\Models\Lote;
use App\Models\Medicamento;
use App\Models\Rol;
use App\Models\Sucursal;
use App\Models\Usuario;
use App\Models\Venta;
use App\Models\Categoria;
use App\Models\Proveedor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Illuminate\Support\Facades\DB;

class VentaControllerTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;
    protected $sucursal;
    protected $medicamento;
    protected $proveedor;
    protected $categoria;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Configurar Roles (Limpiando para evitar duplicados en RefreshDatabase)
        DB::table('roles')->delete();
        DB::table('roles')->insert([
            ['id' => 1, 'nombre' => 'administrador', 'descripcion' => 'Admin', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'nombre' => 'cliente', 'descripcion' => 'Cliente', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // 2. Crear Farmacia (con campos obligatorios)
        $farmacia = Farmacia::create([
            'ruc' => '1791234567001',
            'nombre' => 'FarMedic Test',
            'iva_tasa' => 15.00,
            'telefono_contacto' => '0999999999',
            'email_contacto' => 'test@farmedic.local'
        ]);

        // 3. Crear Sucursal (con campos obligatorios)
        $this->sucursal = Sucursal::create([
            'farmacia_id' => $farmacia->id,
            'nombre' => 'Sucursal Test',
            'ciudad' => 'TestCity',
            'direccion' => 'TestStreet',
            'telefono' => '032000000',
            'activa' => true
        ]);

        // 4. Crear Admin
        $this->admin = Usuario::create([
            'rol_id' => 1,
            'sucursal_id' => $this->sucursal->id,
            'nombre' => 'Admin Test',
            'email' => 'admin_venta@test.com',
            'password' => bcrypt('password'),
            'activo' => true
        ]);

        // 5. Crear Categoría y Proveedor
        $this->categoria = Categoria::create(['nombre' => 'Test Cat', 'descripcion' => 'Desc']);
        $this->proveedor = Proveedor::create(['nombre' => 'Prov', 'ruc' => '1234567890', 'email' => 'p@p.com', 'telefono' => '123']);

        // 6. Crear Medicamento (con todos los campos obligatorios)
        $this->medicamento = Medicamento::create([
            'sucursal_id' => $this->sucursal->id,
            'categoria_id' => $this->categoria->id,
            'proveedor_id' => $this->proveedor->id,
            'nombre_comercial' => 'Paracetamol 500mg',
            'principio_activo' => 'Paracetamol',
            'codigo_barras' => '987654321',
            'precio' => 10.00,
            'stock_minimo' => 5,
            'ubicacion_fisica' => 'A1',
            'requiere_receta' => false,
            'activo' => true
        ]);
    }

    public function test_una_venta_se_procesa_correctamente_con_calculos_e_iva()
    {
        // Crear lotes usando forceCreate para asegurar cantidad_actual
        Lote::forceCreate([
            'medicamento_id' => $this->medicamento->id,
            'sucursal_id' => $this->sucursal->id,
            'proveedor_id' => $this->proveedor->id,
            'numero_lote' => 'LOTE-A',
            'fecha_vencimiento' => now()->addDays(10)->toDateString(),
            'fecha_ingreso' => now()->toDateString(),
            'cantidad_inicial' => 10,
            'cantidad_actual' => 10,
            'costo_unitario' => 5.00
        ]);

        Lote::forceCreate([
            'medicamento_id' => $this->medicamento->id,
            'sucursal_id' => $this->sucursal->id,
            'proveedor_id' => $this->proveedor->id,
            'numero_lote' => 'LOTE-B',
            'fecha_vencimiento' => now()->addDays(20)->toDateString(),
            'fecha_ingreso' => now()->toDateString(),
            'cantidad_inicial' => 10,
            'cantidad_actual' => 10,
            'costo_unitario' => 5.00
        ]);

        $payload = [
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'medicamento_id' => $this->medicamento->id,
                    'cantidad' => 12
                ]
            ]
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/ventas', $payload);

        $response->assertStatus(201);
        $response->assertJsonPath('total', '138.00');
        $response->assertJsonPath('subtotal', '120.00');

        $loteA = Lote::where('numero_lote', 'LOTE-A')->first();
        $this->assertEquals(0, $loteA->cantidad_actual);
    }

    public function test_no_se_puede_vender_mas_del_stock_disponible()
    {
        Lote::forceCreate([
            'medicamento_id' => $this->medicamento->id,
            'sucursal_id' => $this->sucursal->id,
            'proveedor_id' => $this->proveedor->id,
            'numero_lote' => 'LOTE-C',
            'fecha_vencimiento' => now()->addDays(30)->toDateString(),
            'fecha_ingreso' => now()->toDateString(),
            'cantidad_inicial' => 5,
            'cantidad_actual' => 5,
            'costo_unitario' => 5.00
        ]);

        $payload = [
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'medicamento_id' => $this->medicamento->id,
                    'cantidad' => 10
                ]
            ]
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/ventas', $payload);

        $response->assertStatus(422);
    }
}
