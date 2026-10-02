<?php

namespace Tests\Feature;

use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * RS-06: bloqueo de 15 minutos tras 5 intentos fallidos consecutivos (correo+IP);
 * el 6.º intento responde 429. Mismo tratamiento para correos inexistentes.
 */
class LoginBloqueoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        DB::table('roles')->insert([
            ['id' => 3, 'nombre' => 'cliente', 'descripcion' => 'Cliente', 'created_at' => now(), 'updated_at' => now()],
        ]);
        foreach (['uno@prueba.test', 'dos@prueba.test'] as $email) {
            Usuario::create([
                'rol_id' => 3, 'nombre' => 'Cliente', 'email' => $email,
                'password' => 'Clave-Correcta-1', 'activo' => true,
            ]);
        }
    }

    private function login(string $email, string $password, string $ip = '10.0.0.1')
    {
        return $this->withServerVariables(['REMOTE_ADDR' => $ip])
            ->postJson('/api/auth/login', ['email' => $email, 'password' => $password]);
    }

    public function test_el_sexto_intento_fallido_responde_429_con_retry_after()
    {
        for ($i = 1; $i <= 5; $i++) {
            $this->login('uno@prueba.test', 'mala')->assertStatus(401);
        }

        $r = $this->login('uno@prueba.test', 'mala')->assertStatus(429);
        $this->assertGreaterThan(0, (int) $r->headers->get('Retry-After'));
        $this->assertLessThanOrEqual(900, (int) $r->headers->get('Retry-After'));
    }

    public function test_durante_el_bloqueo_se_rechaza_incluso_la_contrasena_correcta()
    {
        for ($i = 1; $i <= 5; $i++) {
            $this->login('uno@prueba.test', 'mala');
        }

        $this->login('uno@prueba.test', 'Clave-Correcta-1')->assertStatus(429);
    }

    public function test_correo_inexistente_se_cuenta_y_responde_igual_que_contrasena_erronea()
    {
        $existente = $this->login('uno@prueba.test', 'mala', '10.0.0.9');
        $inexistente = $this->login('nadie@prueba.test', 'mala', '10.0.0.9');

        $this->assertSame($existente->status(), $inexistente->status());
        $this->assertSame($existente->json('errors.email'), $inexistente->json('errors.email'));

        for ($i = 1; $i <= 4; $i++) {
            $this->login('nadie@prueba.test', 'mala', '10.0.0.9')->assertStatus(401);
        }
        $this->login('nadie@prueba.test', 'mala', '10.0.0.9')->assertStatus(429);
    }

    public function test_otra_cuenta_o_otra_ip_siguen_ingresando()
    {
        for ($i = 1; $i <= 5; $i++) {
            $this->login('uno@prueba.test', 'mala');
        }

        $this->login('dos@prueba.test', 'Clave-Correcta-1')->assertOk()->assertJsonStructure(['token']);
        $this->login('uno@prueba.test', 'Clave-Correcta-1', '10.0.0.2')->assertOk();
    }

    public function test_un_ingreso_exitoso_reinicia_el_contador()
    {
        for ($i = 1; $i <= 4; $i++) {
            $this->login('uno@prueba.test', 'mala');
        }
        $this->login('uno@prueba.test', 'Clave-Correcta-1')->assertOk();

        for ($i = 1; $i <= 4; $i++) {
            $this->login('uno@prueba.test', 'mala')->assertStatus(401);
        }
    }

    public function test_los_errores_de_validacion_no_cuentan_como_intento()
    {
        for ($i = 1; $i <= 6; $i++) {
            $this->postJson('/api/auth/login', ['email' => 'uno@prueba.test'])->assertStatus(422);
        }

        $this->login('uno@prueba.test', 'Clave-Correcta-1')->assertOk();
    }
}
