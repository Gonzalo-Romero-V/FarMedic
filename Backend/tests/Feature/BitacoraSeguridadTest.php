<?php

namespace Tests\Feature;

use App\Models\EventoSeguridad;
use App\Models\Rol;
use App\Models\Sucursal;
use App\Models\Usuario;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * RS-15: se registra cada inicio de sesión (exitoso o fallido), cierre de sesión, cambio
 * de contraseña, cambio de rol, desactivación y acceso denegado, con usuario, fecha y
 * hora, IP, agente y acción, sin contraseñas ni tokens.
 */
class BitacoraSeguridadTest extends TestCase
{
    use RefreshDatabase;

    private const CLAVE = 'Clave-Original-Secreta-1';
    private const CLAVE_NUEVA = 'Zafiro-Lluvia-Nueva-4821';

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
            'nombre' => 'Persona', 'email' => $email,
            'password' => self::CLAVE, 'activo' => true,
        ]);
    }

    private function login(string $email, string $password)
    {
        return $this->withHeaders(['User-Agent' => 'PruebaBitacora/1.0'])
            ->withServerVariables(['REMOTE_ADDR' => '10.1.2.3'])
            ->postJson('/api/auth/login', ['email' => $email, 'password' => $password]);
    }

    private function evento(string $accion, string $resultado): ?EventoSeguridad
    {
        return EventoSeguridad::where('accion', $accion)->where('resultado', $resultado)->latest('id')->first();
    }

    public function test_login_fallido_de_cuenta_existente_y_de_correo_inexistente()
    {
        $this->login('cliente@prueba.test', 'mala')->assertStatus(401);
        $existente = $this->evento('login', 'fallido');
        $this->assertSame($this->cliente->id, $existente->usuario_id);
        $this->assertSame('10.1.2.3', $existente->ip);
        $this->assertSame('PruebaBitacora/1.0', $existente->agente);
        $this->assertNotNull($existente->created_at);

        $this->login('nadie@prueba.test', 'mala')->assertStatus(401);
        $this->assertNull($this->evento('login', 'fallido')->usuario_id);
        $this->assertSame(2, EventoSeguridad::where('accion', 'login')->where('resultado', 'fallido')->count());
    }

    public function test_login_exitoso_y_logout()
    {
        $token = $this->login('cliente@prueba.test', self::CLAVE)->assertOk()->json('token');
        $this->assertSame($this->cliente->id, $this->evento('login', 'exitoso')->usuario_id);

        $this->app['auth']->forgetGuards();
        $this->withToken($token)->postJson('/api/auth/logout')->assertNoContent();
        $this->assertSame($this->cliente->id, $this->evento('logout', 'exitoso')->usuario_id);
    }

    public function test_el_bloqueo_por_intentos_queda_registrado()
    {
        for ($i = 0; $i < 6; $i++) {
            $this->login('cliente@prueba.test', 'mala');
        }

        $this->assertNotNull($this->evento('login', 'bloqueado'));
    }

    public function test_cambio_de_contrasena_propio_exitoso_y_fallido()
    {
        Sanctum::actingAs($this->cliente);

        $this->postJson('/api/auth/me/password', ['password_actual' => 'incorrecta', 'password_nueva' => self::CLAVE_NUEVA])
            ->assertStatus(422);
        $this->assertSame($this->cliente->id, $this->evento('cambio_contrasena', 'fallido')->usuario_id);

        $this->postJson('/api/auth/me/password', ['password_actual' => self::CLAVE, 'password_nueva' => self::CLAVE_NUEVA])
            ->assertNoContent();
        $this->assertSame($this->cliente->id, $this->evento('cambio_contrasena', 'exitoso')->usuario_id);
    }

    public function test_cambio_de_rol_y_desactivacion_registran_actor_y_objetivo()
    {
        Sanctum::actingAs($this->admin);
        $rolEmpleado = Rol::where('nombre', 'empleado')->value('id');

        $this->patchJson("/api/usuarios/{$this->cliente->id}/rol", [
            'rol_id' => $rolEmpleado, 'sucursal_id' => $this->admin->sucursal_id,
        ])->assertOk();
        $cambio = $this->evento('cambio_rol', 'exitoso');
        $this->assertSame($this->admin->id, $cambio->usuario_id);
        $this->assertSame($this->cliente->id, $cambio->objetivo_id);
        $this->assertStringContainsString('cliente', $cambio->detalle);
        $this->assertStringContainsString('empleado', $cambio->detalle);

        $this->deleteJson("/api/usuarios/{$this->empleado->id}")->assertNoContent();
        $des = $this->evento('desactivacion', 'exitoso');
        $this->assertSame($this->admin->id, $des->usuario_id);
        $this->assertSame($this->empleado->id, $des->objetivo_id);
    }

    public function test_acceso_denegado_por_rol_y_por_policy()
    {
        Sanctum::actingAs($this->empleado);
        $this->getJson('/api/admin/dashboard')->assertStatus(403);
        $porRol = $this->evento('acceso_denegado', 'denegado');
        $this->assertSame($this->empleado->id, $porRol->usuario_id);
        $this->assertStringContainsString('api/admin/dashboard', $porRol->detalle);

        Sanctum::actingAs($this->cliente);
        $this->putJson("/api/usuarios/{$this->admin->id}", ['nombre' => 'X'])->assertStatus(403);
        $porPolicy = $this->evento('acceso_denegado', 'denegado');
        $this->assertSame($this->cliente->id, $porPolicy->usuario_id);
        $this->assertStringContainsString('PUT api/usuarios/{usuario}', $porPolicy->detalle);
    }

    public function test_ningun_registro_contiene_contrasenas_ni_tokens()
    {
        $token = $this->login('cliente@prueba.test', self::CLAVE)->assertOk()->json('token');
        $this->login('cliente@prueba.test', 'otra-clave-equivocada');
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->postJson('/api/auth/me/password', [
            'password_actual' => self::CLAVE, 'password_nueva' => self::CLAVE_NUEVA,
        ])->assertNoContent();
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->postJson('/api/auth/logout')->assertNoContent();

        $this->assertGreaterThan(0, EventoSeguridad::count());
        $volcado = json_encode(EventoSeguridad::all()->toArray());
        $tokenPlano = explode('|', $token, 2)[1];

        foreach ([self::CLAVE, self::CLAVE_NUEVA, 'otra-clave-equivocada', $token, $tokenPlano] as $secreto) {
            $this->assertStringNotContainsString($secreto, $volcado);
        }
    }
}
