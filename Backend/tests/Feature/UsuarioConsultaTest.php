<?php

namespace Tests\Feature;

use App\Models\Pedido;
use App\Models\Rol;
use App\Models\Sucursal;
use App\Models\Usuario;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * RS-02: la consulta de un usuario se permite al propietario, al administrador y,
 * solo teléfono y dirección, al empleado con un pedido activo a domicilio del
 * cliente en su sucursal.
 */
class UsuarioConsultaTest extends TestCase
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
            'nombre' => 'Persona ' . $email,
            'email' => $email,
            'password' => 'Clave-Original-1',
            'telefono' => '+593 90 000 0000',
            'direccion' => 'Calle 123',
            'activo' => true,
        ]);
    }

    private function pedido(Usuario $cliente, string $entrega = 'domicilio', string $estado = 'pendiente', ?Sucursal $sucursal = null): Pedido
    {
        return Pedido::create([
            'sucursal_id' => ($sucursal ?? $this->sucursal)->id,
            'cliente_id' => $cliente->id,
            'numero_pedido' => str_pad((string) (Pedido::count() + 1), 7, '0', STR_PAD_LEFT),
            'tipo_entrega' => $entrega,
            'direccion_envio' => 'Calle 123',
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
        $this->getJson("/api/usuarios/{$this->clienteA->id}")->assertStatus(401);
    }

    public function test_cliente_no_puede_consultar_a_otro_cliente()
    {
        Sanctum::actingAs($this->clienteB);

        $this->getJson("/api/usuarios/{$this->clienteA->id}")->assertStatus(403);
    }

    public function test_propietario_y_administrador_obtienen_el_registro_completo()
    {
        Sanctum::actingAs($this->clienteA);
        $this->getJson("/api/usuarios/{$this->clienteA->id}")
            ->assertOk()->assertJsonPath('email', 'a@prueba.test')->assertJsonPath('rol.nombre', 'cliente');

        Sanctum::actingAs($this->admin);
        $this->getJson("/api/usuarios/{$this->clienteA->id}")
            ->assertOk()->assertJsonPath('email', 'a@prueba.test');
    }

    public function test_empleado_sin_pedido_asociado_recibe_403()
    {
        $this->pedido($this->clienteA);
        Sanctum::actingAs($this->empleado);

        $this->getJson("/api/usuarios/{$this->clienteB->id}")->assertStatus(403);
    }

    public function test_empleado_con_pedido_activo_a_domicilio_de_su_sucursal_recibe_solo_tres_campos()
    {
        $this->pedido($this->clienteA, 'domicilio', 'en_camino');
        Sanctum::actingAs($this->empleado);

        $r = $this->getJson("/api/usuarios/{$this->clienteA->id}")->assertOk();

        $this->assertSame(['direccion', 'nombre', 'telefono'], collect($r->json())->keys()->sort()->values()->all());
        $r->assertJsonPath('telefono', '+593 90 000 0000')->assertJsonPath('direccion', 'Calle 123');
    }

    public function test_empleado_de_otra_sucursal_recibe_403()
    {
        $this->pedido($this->clienteA);
        Sanctum::actingAs($this->empleadoOtraSucursal);

        $this->getJson("/api/usuarios/{$this->clienteA->id}")->assertStatus(403);
    }

    public function test_empleado_con_pedido_no_activo_o_sin_entrega_a_domicilio_recibe_403()
    {
        $this->pedido($this->clienteA, 'domicilio', 'entregado');
        $this->pedido($this->clienteA, 'domicilio', 'cancelado');
        $this->pedido($this->clienteA, 'retiro_local', 'pendiente');
        Sanctum::actingAs($this->empleado);

        $this->getJson("/api/usuarios/{$this->clienteA->id}")->assertStatus(403);
    }

    public function test_empleado_no_puede_consultar_a_usuarios_internos()
    {
        Sanctum::actingAs($this->empleado);

        $this->getJson("/api/usuarios/{$this->admin->id}")->assertStatus(403);
        $this->getJson("/api/usuarios/{$this->empleadoOtraSucursal->id}")->assertStatus(403);
    }
}
