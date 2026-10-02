<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * RS-08: el registro de cuentas de cliente se limita a tres por dirección IP por hora.
 */
class RegistroLimiteTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        DB::table('roles')->insert([
            ['id' => 3, 'nombre' => 'cliente', 'descripcion' => 'Cliente', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    private function registrar(int $n, string $ip)
    {
        return $this->withServerVariables(['REMOTE_ADDR' => $ip])->postJson('/api/auth/register/cliente', [
            'nombre' => "Cliente $n",
            'email' => "cliente$n@prueba.test",
            'password' => 'Clave-Robusta-123',
        ]);
    }

    public function test_el_cuarto_registro_desde_la_misma_ip_responde_429()
    {
        for ($i = 1; $i <= 3; $i++) {
            $this->registrar($i, '10.0.0.1')->assertStatus(201);
        }

        $r = $this->registrar(4, '10.0.0.1')->assertStatus(429);
        $this->assertGreaterThan(0, (int) $r->headers->get('Retry-After'));
    }

    public function test_desde_otra_ip_el_registro_sigue_funcionando()
    {
        for ($i = 1; $i <= 3; $i++) {
            $this->registrar($i, '10.0.0.1')->assertStatus(201);
        }
        $this->registrar(4, '10.0.0.1')->assertStatus(429);

        $this->registrar(5, '10.0.0.2')->assertStatus(201);
    }
}
