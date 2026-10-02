<?php

namespace Tests\Feature;

use App\Models\Rol;
use App\Models\Sucursal;
use App\Models\Usuario;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * RS-04: se rechaza toda petición de un usuario desactivado y se revocan sus tokens.
 */
class UsuarioDesactivadoTest extends TestCase
{
    use RefreshDatabase;

    private Usuario $admin;
    private Usuario $empleado;
    private Usuario $cliente;

    protected function setUp(): void
    {
        parent::setUp();
        config(['admin_inicial.password' => null]);
        $this->seed(DatabaseSeeder::class);

        $sucursal = Sucursal::firstOrFail();
        $this->admin = $this->crear('admin@prueba.test', 'administrador', $sucursal->id);
        $this->empleado = $this->crear('empleado@prueba.test', 'empleado', $sucursal->id);
        $this->cliente = $this->crear('cliente@prueba.test', 'cliente');
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

    private function conToken(string $token, string $metodo, string $url)
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($token)->json($metodo, $url);
    }

    public function test_un_usuario_activo_con_token_valido_sigue_operando()
    {
        $token = $this->empleado->createToken('t')->plainTextToken;

        $this->conToken($token, 'GET', '/api/auth/me')->assertOk();
        $this->conToken($token, 'GET', '/api/proveedores')->assertOk();
    }

    public function test_al_desactivar_con_delete_se_revocan_los_tokens_y_toda_peticion_da_401()
    {
        $token = $this->empleado->createToken('t')->plainTextToken;
        $this->conToken($token, 'GET', '/api/auth/me')->assertOk();

        Sanctum::actingAs($this->admin);
        $this->deleteJson("/api/usuarios/{$this->empleado->id}")->assertNoContent();

        $this->assertSame(0, $this->empleado->tokens()->count());
        $this->conToken($token, 'GET', '/api/auth/me')->assertStatus(401);
        $this->conToken($token, 'GET', '/api/proveedores')->assertStatus(401);
    }

    public function test_al_desactivar_con_put_tambien_se_revocan_los_tokens()
    {
        $token = $this->cliente->createToken('t')->plainTextToken;

        Sanctum::actingAs($this->admin);
        $this->putJson("/api/usuarios/{$this->cliente->id}", ['activo' => false])->assertOk();

        $this->assertSame(0, $this->cliente->tokens()->count());
        $this->conToken($token, 'GET', '/api/auth/me')->assertStatus(401);
    }

    public function test_si_el_usuario_queda_inactivo_con_el_token_vivo_el_middleware_igual_lo_rechaza()
    {
        $token = $this->cliente->createToken('t')->plainTextToken;
        Usuario::where('id', $this->cliente->id)->update(['activo' => false]);

        $this->conToken($token, 'GET', '/api/auth/me')->assertStatus(401);
        $this->conToken($token, 'GET', '/api/pedidos')->assertStatus(401);
        $this->conToken($token, 'POST', '/api/auth/logout')->assertStatus(401);
    }
}
