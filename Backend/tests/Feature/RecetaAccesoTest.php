<?php

namespace Tests\Feature;

use App\Models\Pedido;
use App\Models\Receta;
use App\Models\Rol;
use App\Models\Sucursal;
use App\Models\Usuario;
use App\Models\Venta;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * RS-03: una receta la consulta su propietario (cliente de la venta o del pedido que
 * la referencia), los empleados de la sucursal y el administrador.
 */
class RecetaAccesoTest extends TestCase
{
    use RefreshDatabase;

    private Sucursal $sucursal;
    private Sucursal $otraSucursal;
    private Usuario $admin;
    private Usuario $empleado;
    private Usuario $empleadoOtraSucursal;
    private Usuario $clienteA;
    private Usuario $clienteB;

    protected function setUp(): void
    {
        parent::setUp();
        config(['admin_inicial.password' => null]);
        $this->seed(DatabaseSeeder::class);

        [$this->sucursal, $this->otraSucursal] = Sucursal::orderBy('id')->take(2)->get()->all();
        $this->admin = $this->crear('admin@prueba.test', 'administrador', $this->sucursal->id);
        $this->empleado = $this->crear('empleado@prueba.test', 'empleado', $this->sucursal->id);
        $this->empleadoOtraSucursal = $this->crear('empleado2@prueba.test', 'empleado', $this->otraSucursal->id);
        $this->clienteA = $this->crear('a@prueba.test', 'cliente');
        $this->clienteB = $this->crear('b@prueba.test', 'cliente');
    }

    private function crear(string $email, string $rol, ?int $sucursalId = null): Usuario
    {
        return Usuario::create([
            'rol_id' => Rol::where('nombre', $rol)->value('id'),
            'sucursal_id' => $sucursalId,
            'nombre' => 'Persona',
            'email' => $email,
            'password' => 'Clave-Original-1',
            'activo' => true,
        ]);
    }

    private function receta(): Receta
    {
        return Receta::create(['numero' => 'R-' . (Receta::count() + 1)]);
    }

    private function ventaCon(Receta $receta, ?Usuario $cliente, string $estado = 'completada'): Venta
    {
        return Venta::create([
            'sucursal_id' => $this->sucursal->id,
            'usuario_id' => $this->empleado->id,
            'cliente_id' => $cliente?->id,
            'receta_id' => $receta->id,
            'numero_comprobante' => str_pad((string) (Venta::count() + 1), 7, '0', STR_PAD_LEFT),
            'subtotal' => 10,
            'descuento_total' => 0,
            'iva_tasa_aplicada' => 15,
            'impuesto_total' => 1.5,
            'total' => 11.5,
            'metodo_pago' => 'efectivo',
            'estado' => $estado,
            'fecha' => now(),
        ]);
    }

    private function pedidoCon(Receta $receta, Usuario $cliente, string $estado = 'pendiente'): Pedido
    {
        return Pedido::create([
            'sucursal_id' => $this->sucursal->id,
            'cliente_id' => $cliente->id,
            'receta_id' => $receta->id,
            'numero_pedido' => str_pad((string) (Pedido::count() + 1), 7, '0', STR_PAD_LEFT),
            'tipo_entrega' => 'retiro_local',
            'telefono_contacto' => '+593 90 000 0000',
            'estado' => $estado,
            'subtotal' => 10,
            'iva_tasa_aplicada' => 15,
            'impuesto_total' => 1.5,
            'total' => 11.5,
            'fecha_solicitud' => now(),
        ]);
    }

    public function test_sin_token_no_puede_consultar()
    {
        $this->getJson('/api/recetas/' . $this->receta()->id)->assertStatus(401);
    }

    public function test_cliente_b_no_puede_ver_la_receta_de_una_venta_del_cliente_a()
    {
        $receta = $this->receta();
        $this->ventaCon($receta, $this->clienteA);
        Sanctum::actingAs($this->clienteB);

        $this->getJson("/api/recetas/{$receta->id}")->assertStatus(403);
    }

    public function test_cliente_b_no_puede_ver_la_receta_de_un_pedido_del_cliente_a()
    {
        $receta = $this->receta();
        $this->pedidoCon($receta, $this->clienteA);
        Sanctum::actingAs($this->clienteB);

        $this->getJson("/api/recetas/{$receta->id}")->assertStatus(403);
    }

    public function test_el_cliente_propietario_la_ve_por_venta_o_por_pedido()
    {
        $porVenta = $this->receta();
        $this->ventaCon($porVenta, $this->clienteA);
        $porPedido = $this->receta();
        $this->pedidoCon($porPedido, $this->clienteA);
        Sanctum::actingAs($this->clienteA);

        $this->getJson("/api/recetas/{$porVenta->id}")->assertOk()->assertJsonPath('id', $porVenta->id);
        $this->getJson("/api/recetas/{$porPedido->id}")->assertOk();
    }

    public function test_el_cliente_sigue_siendo_propietario_si_la_venta_se_anula_o_el_pedido_se_cancela()
    {
        $porVenta = $this->receta();
        $this->ventaCon($porVenta, $this->clienteA, 'anulada');
        $porPedido = $this->receta();
        $this->pedidoCon($porPedido, $this->clienteA, 'cancelado');
        Sanctum::actingAs($this->clienteA);

        $this->getJson("/api/recetas/{$porVenta->id}")->assertOk();
        $this->getJson("/api/recetas/{$porPedido->id}")->assertOk();
    }

    public function test_empleado_de_la_sucursal_y_administrador_la_ven_y_el_de_otra_sucursal_no()
    {
        $receta = $this->receta();
        $this->ventaCon($receta, $this->clienteA);

        Sanctum::actingAs($this->empleado);
        $this->getJson("/api/recetas/{$receta->id}")->assertOk();

        Sanctum::actingAs($this->admin);
        $this->getJson("/api/recetas/{$receta->id}")->assertOk();

        Sanctum::actingAs($this->empleadoOtraSucursal);
        $this->getJson("/api/recetas/{$receta->id}")->assertStatus(403);
    }

    public function test_receta_sin_venta_ni_pedido_solo_la_ven_empleados_y_administrador()
    {
        $receta = $this->receta();

        Sanctum::actingAs($this->clienteA);
        $this->getJson("/api/recetas/{$receta->id}")->assertStatus(403);

        Sanctum::actingAs($this->empleadoOtraSucursal);
        $this->getJson("/api/recetas/{$receta->id}")->assertOk();

        Sanctum::actingAs($this->admin);
        $this->getJson("/api/recetas/{$receta->id}")->assertOk();
    }

    public function test_venta_de_mostrador_sin_cliente_solo_la_ven_empleados_de_esa_sucursal_y_administrador()
    {
        $receta = $this->receta();
        $this->ventaCon($receta, null);

        Sanctum::actingAs($this->clienteA);
        $this->getJson("/api/recetas/{$receta->id}")->assertStatus(403);

        Sanctum::actingAs($this->empleadoOtraSucursal);
        $this->getJson("/api/recetas/{$receta->id}")->assertStatus(403);

        Sanctum::actingAs($this->empleado);
        $this->getJson("/api/recetas/{$receta->id}")->assertOk();

        Sanctum::actingAs($this->admin);
        $this->getJson("/api/recetas/{$receta->id}")->assertOk();
    }
}
