<?php

namespace Tests\Feature;

use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Illuminate\Support\Facades\DB;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Limpiar y asegurar roles básicos
        DB::table('roles')->delete();
        DB::table('roles')->insert([
            ['id' => 1, 'nombre' => 'administrador', 'descripcion' => 'Admin', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'nombre' => 'cliente', 'descripcion' => 'Cliente', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function test_login_con_credenciales_correctas_devuelve_token()
    {
        $usuario = Usuario::create([
            'rol_id' => 1,
            'nombre' => 'Admin Test',
            'email' => 'admin@test.com',
            'password' => bcrypt('password123'),
            'activo' => true
        ]);

        $payload = [
            'email' => 'admin@test.com',
            'password' => 'password123'
        ];

        $response = $this->postJson('/api/auth/login', $payload);

        $response->assertStatus(200);
        $response->assertJsonStructure(['user', 'token']);
        $this->assertEquals('admin@test.com', $response->json('user.email'));
    }

    public function test_login_con_credenciales_incorrectas_falla()
    {
        Usuario::create([
            'rol_id' => 1,
            'nombre' => 'Admin Test',
            'email' => 'admin2@test.com', // Cambiado para evitar colisiones si RefreshDatabase falla
            'password' => bcrypt('password123'),
            'activo' => true
        ]);

        $payload = [
            'email' => 'admin2@test.com',
            'password' => 'password_incorrecto'
        ];

        $response = $this->postJson('/api/auth/login', $payload);

        $response->assertStatus(401);
        $response->assertJsonFragment(['message' => 'Credenciales inválidas']);
    }

    public function test_registro_de_cliente_crea_usuario_con_rol_cliente()
    {
        $payload = [
            'nombre' => 'Nuevo Cliente',
            'email' => 'cliente_nuevo@test.com',
            'password' => 'password123',
            'telefono' => '0987654321',
            'direccion' => 'Calle Falsa 123'
        ];

        $response = $this->postJson('/api/auth/register/cliente', $payload);

        $response->assertStatus(201);
        $response->assertJsonPath('user.rol.nombre', 'cliente');
        $this->assertDatabaseHas('usuarios', ['email' => 'cliente_nuevo@test.com']);
    }

    public function test_logout_revoca_el_token_actual()
    {
        $usuario = Usuario::create([
            'rol_id' => 1,
            'nombre' => 'Admin Test',
            'email' => 'admin3@test.com',
            'password' => bcrypt('password123'),
            'activo' => true
        ]);

        $token = $usuario->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/logout');

        $response->assertStatus(204);
        
        // Refrescar instancia del usuario para verificar tokens
        $usuario = $usuario->fresh();
        $this->assertCount(0, $usuario->tokens);
    }
}
