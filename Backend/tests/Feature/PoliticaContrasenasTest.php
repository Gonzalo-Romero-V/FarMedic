<?php

namespace Tests\Feature;

use App\Models\Rol;
use App\Models\Sucursal;
use App\Models\Usuario;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * RS-07: no se aceptan contraseñas de menos de 8 caracteres ni las de la lista local
 * de contraseñas comunes (registro, cambio propio, alta de usuarios y restablecimiento
 * por el administrador).
 */
class PoliticaContrasenasTest extends TestCase
{
    use RefreshDatabase;

    private const ROBUSTA = 'Zafiro-Lluvia-4821';

    private Usuario $admin;
    private Usuario $cliente;

    protected function setUp(): void
    {
        parent::setUp();
        config(['admin_inicial.password' => null]);
        $this->seed(DatabaseSeeder::class);

        $this->admin = Usuario::create([
            'rol_id' => Rol::where('nombre', 'administrador')->value('id'),
            'sucursal_id' => Sucursal::firstOrFail()->id,
            'nombre' => 'Admin', 'email' => 'admin@prueba.test',
            'password' => 'Clave-Original-1', 'activo' => true,
        ]);
        $this->cliente = Usuario::create([
            'rol_id' => Rol::where('nombre', 'cliente')->value('id'),
            'nombre' => 'Cliente', 'email' => 'cliente@prueba.test',
            'password' => 'Clave-Original-1', 'activo' => true,
        ]);
    }

    public static function contrasenasRechazadas(): array
    {
        return [
            'corta' => ['abc123'],
            'siete caracteres' => ['Abcd123'],
            'lista de comunes' => ['12345678'],
            'comun sin importar mayusculas' => ['QWERTYUIOP'],
        ];
    }

    #[DataProvider('contrasenasRechazadas')]
    public function test_el_registro_rechaza_contrasenas_debiles($password)
    {
        $this->postJson('/api/auth/register/cliente', [
            'nombre' => 'Nuevo', 'email' => 'nuevo@prueba.test', 'password' => $password,
        ])->assertStatus(422)->assertJsonValidationErrors('password');

        $this->assertDatabaseMissing('usuarios', ['email' => 'nuevo@prueba.test']);
    }

    public function test_el_registro_acepta_una_contrasena_robusta()
    {
        $this->postJson('/api/auth/register/cliente', [
            'nombre' => 'Nuevo', 'email' => 'nuevo@prueba.test', 'password' => self::ROBUSTA,
        ])->assertStatus(201);
    }

    #[DataProvider('contrasenasRechazadas')]
    public function test_el_cambio_propio_rechaza_contrasenas_debiles($password)
    {
        Sanctum::actingAs($this->cliente);

        $this->postJson('/api/auth/me/password', [
            'password_actual' => 'Clave-Original-1', 'password_nueva' => $password,
        ])->assertStatus(422)->assertJsonValidationErrors('password_nueva');
    }

    public function test_el_cambio_propio_acepta_una_contrasena_robusta()
    {
        Sanctum::actingAs($this->cliente);

        $this->postJson('/api/auth/me/password', [
            'password_actual' => 'Clave-Original-1', 'password_nueva' => self::ROBUSTA,
        ])->assertNoContent();
    }

    public function test_el_alta_de_usuarios_por_el_administrador_valida_la_contrasena()
    {
        Sanctum::actingAs($this->admin);
        $base = [
            'rol_id' => Rol::where('nombre', 'cliente')->value('id'),
            'nombre' => 'Alta', 'email' => 'alta@prueba.test',
        ];

        $this->postJson('/api/usuarios', $base + ['password' => 'password'])->assertStatus(422);
        $this->postJson('/api/usuarios', $base + ['password' => self::ROBUSTA])->assertCreated();
    }

    public function test_el_administrador_no_puede_fijar_una_contrasena_debil_a_otro_usuario()
    {
        Sanctum::actingAs($this->admin);

        $this->putJson("/api/usuarios/{$this->cliente->id}", ['password' => '12345678'])
            ->assertStatus(422)->assertJsonValidationErrors('password');
        $this->putJson("/api/usuarios/{$this->cliente->id}", ['password' => self::ROBUSTA])->assertOk();
    }
}
