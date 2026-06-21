<?php

namespace Tests\Feature;

use App\Models\Farmacia;
use App\Models\Lote;
use App\Models\Medicamento;
use App\Models\Sucursal;
use App\Models\Categoria;
use App\Models\Proveedor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class LoteTest extends TestCase
{
    use RefreshDatabase;

    protected $sucursal;
    protected $medicamento;
    protected $proveedor;

    protected function setUp(): void
    {
        parent::setUp();

        $farmacia = Farmacia::create([
            'ruc' => '1791234567001',
            'nombre' => 'FarMedic Test',
            'iva_tasa' => 15.00,
            'telefono_contacto' => '0999999999',
            'email_contacto' => 'test@farmedic.local'
        ]);

        $this->sucursal = Sucursal::create([
            'farmacia_id' => $farmacia->id,
            'nombre' => 'Sucursal Test',
            'ciudad' => 'TestCity',
            'direccion' => 'TestStreet',
            'telefono' => '032000000',
            'activa' => true
        ]);

        $categoria = Categoria::create([
            'nombre' => 'Genericos',
            'descripcion' => 'Medicamentos genericos'
        ]);

        $this->proveedor = Proveedor::create([
            'nombre' => 'Proveedor Test',
            'ruc' => '1790000000001',
            'email' => 'prov@test.com',
            'telefono' => '022222222'
        ]);

        $this->medicamento = Medicamento::create([
            'sucursal_id' => $this->sucursal->id,
            'categoria_id' => $categoria->id,
            'proveedor_id' => $this->proveedor->id,
            'nombre_comercial' => 'Ibuprofeno 500mg',
            'principio_activo' => 'Ibuprofeno',
            'codigo_barras' => '123456789',
            'precio' => 5.00,
            'stock_minimo' => 10,
            'ubicacion_fisica' => 'Estante A-1',
            'requiere_receta' => false,
            'activo' => true
        ]);
    }

    public function test_el_estado_del_lote_es_vencido_si_la_fecha_ya_paso()
    {
        $lote = Lote::forceCreate([
            'medicamento_id' => $this->medicamento->id,
            'sucursal_id' => $this->sucursal->id,
            'proveedor_id' => $this->proveedor->id,
            'numero_lote' => 'VENCIDO-001',
            'fecha_vencimiento' => now()->subDay()->toDateString(),
            'fecha_ingreso' => now()->subMonth()->toDateString(),
            'cantidad_inicial' => 100,
            'cantidad_actual' => 100,
            'costo_unitario' => 2.00
        ]);

        $this->assertEquals('vencido', $lote->estado);
    }

    public function test_el_estado_del_lote_es_proximo_a_vencer_si_vence_en_menos_de_30_dias()
    {
        $lote = Lote::forceCreate([
            'medicamento_id' => $this->medicamento->id,
            'sucursal_id' => $this->sucursal->id,
            'proveedor_id' => $this->proveedor->id,
            'numero_lote' => 'PROXIMO-001',
            'fecha_vencimiento' => now()->addDays(15)->toDateString(),
            'fecha_ingreso' => now()->toDateString(),
            'cantidad_inicial' => 100,
            'cantidad_actual' => 100,
            'costo_unitario' => 2.00
        ]);

        $this->assertEquals('proximo_a_vencer', $lote->estado);
    }

    public function test_el_estado_del_lote_es_vigente_si_la_fecha_es_lejana()
    {
        $lote = Lote::forceCreate([
            'medicamento_id' => $this->medicamento->id,
            'sucursal_id' => $this->sucursal->id,
            'proveedor_id' => $this->proveedor->id,
            'numero_lote' => 'VIGENTE-001',
            'fecha_vencimiento' => now()->addMonths(6)->toDateString(),
            'fecha_ingreso' => now()->toDateString(),
            'cantidad_inicial' => 100,
            'cantidad_actual' => 100,
            'costo_unitario' => 2.00
        ]);

        $this->assertEquals('vigente', $lote->estado);
    }

    public function test_el_lote_pertenece_a_un_medicamento_y_sucursal()
    {
        $lote = Lote::forceCreate([
            'medicamento_id' => $this->medicamento->id,
            'sucursal_id' => $this->sucursal->id,
            'proveedor_id' => $this->proveedor->id,
            'numero_lote' => 'REL-001',
            'fecha_vencimiento' => now()->addYear()->toDateString(),
            'fecha_ingreso' => now()->toDateString(),
            'cantidad_inicial' => 10,
            'cantidad_actual' => 10,
            'costo_unitario' => 1.00
        ]);

        $this->assertInstanceOf(Medicamento::class, $lote->medicamento);
        $this->assertInstanceOf(Sucursal::class, $lote->sucursal);
        $this->assertEquals('Ibuprofeno 500mg', $lote->medicamento->nombre_comercial);
    }
}
