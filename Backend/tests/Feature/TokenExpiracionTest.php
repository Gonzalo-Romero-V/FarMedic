<?php

namespace Tests\Feature;

use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * RS-11: todo token de acceso se invalida 8 horas (480 minutos) después de emitido.
 */
class TokenExpiracionTest extends TestCase
{
    use RefreshDatabase;

    private function tokenNuevo(): string
    {
        DB::table('roles')->insertOrIgnore([
            ['id' => 3, 'nombre' => 'cliente', 'descripcion' => 'Cliente', 'created_at' => now(), 'updated_at' => now()],
        ]);
        $usuario = Usuario::create([
            'rol_id' => 3, 'nombre' => 'Cliente', 'email' => 'cliente@prueba.test',
            'password' => 'Clave-Robusta-123', 'activo' => true,
        ]);

        return $usuario->createToken('prueba')->plainTextToken;
    }

    private function me(string $token)
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($token)->getJson('/api/auth/me');
    }

    public function test_la_expiracion_configurada_es_de_480_minutos()
    {
        $this->assertSame(480, config('sanctum.expiration'));
    }

    public function test_un_token_recien_emitido_funciona()
    {
        $this->me($this->tokenNuevo())->assertOk();
    }

    public function test_un_token_funciona_antes_de_las_8_horas_y_deja_de_funcionar_despues()
    {
        $token = $this->tokenNuevo();

        $this->travel(479)->minutes();
        $this->me($token)->assertOk();

        $this->travel(2)->minutes();
        $this->me($token)->assertStatus(401);
    }
}
