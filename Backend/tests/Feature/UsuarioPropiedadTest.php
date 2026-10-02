<?php

namespace Tests\Feature;

use App\Models\Rol;
use App\Models\Sucursal;
use App\Models\Usuario;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * RS-01: solo el administrador modifica datos de otros usuarios; el propietario
 * solo edita su perfil y nunca correo, contraseña, sucursal, rol ni estado.
 */
class UsuarioPropiedadTest extends TestCase
{
    use RefreshDatabase;

    private Usuario $admin;
    private Usuario $empleado;
    private Usuario $clienteA;
    private Usuario $clienteB;

    protected function setUp(): void
    {
        parent::setUp();
        config(['admin_inicial.password' => null]);
        $this->seed(DatabaseSeeder::class);

        $sucursal = Sucursal::firstOrFail();
        $this->admin = $this->crear('admin@prueba.test', 'administrador', $sucursal->id);
        $this->empleado = $this->crear('empleado@prueba.test', 'empleado', $sucursal->id);
        $this->clienteA = $this->crear('a@prueba.test', 'cliente');
        $this->clienteB = $this->crear('b@prueba.test', 'cliente');
    }

    private function crear(string $email, string $rol, ?int $sucursalId = null): Usuario
    {
        return Usuario::create([
            'rol_id' => Rol::where('nombre', $rol)->value('id'),
            'sucursal_id' => $sucursalId,
            'nombre' => 'Original ' . $rol,
            'email' => $email,
            'password' => 'Clave-Original-1',
            'activo' => true,
        ]);
    }

    public function test_sin_token_no_puede_modificar()
    {
        $this->putJson("/api/usuarios/{$this->admin->id}", ['nombre' => 'X'])->assertStatus(401);
    }

    public function test_cliente_no_puede_modificar_al_administrador()
    {
        Sanctum::actingAs($this->clienteA);

        $this->putJson("/api/usuarios/{$this->admin->id}", [
            'email' => 'tomado@prueba.test',
            'password' => 'Clave-Tomada-99',
        ])->assertStatus(403);

        $admin = $this->admin->fresh();
        $this->assertSame('admin@prueba.test', $admin->email);
        $this->assertTrue(Hash::check('Clave-Original-1', $admin->password));
    }

    public function test_cliente_no_puede_modificar_a_otro_cliente()
    {
        Sanctum::actingAs($this->clienteA);

        $this->putJson("/api/usuarios/{$this->clienteB->id}", ['nombre' => 'Hackeado'])->assertStatus(403);

        $this->assertSame('Original cliente', $this->clienteB->fresh()->nombre);
    }

    public function test_cliente_puede_editar_su_propio_perfil()
    {
        Sanctum::actingAs($this->clienteA);

        $this->putJson("/api/usuarios/{$this->clienteA->id}", [
            'nombre' => 'Nombre Nuevo',
            'telefono' => '+593 99 111 2222',
            'direccion' => 'Calle Nueva 1',
        ])->assertOk()->assertJsonPath('nombre', 'Nombre Nuevo');

        $a = $this->clienteA->fresh();
        $this->assertSame('+593 99 111 2222', $a->telefono);
        $this->assertSame('Calle Nueva 1', $a->direccion);
    }

    public function test_propietario_no_puede_tocar_campos_reservados_al_administrador()
    {
        Sanctum::actingAs($this->clienteA);

        foreach ([
            ['email' => 'otro@prueba.test'],
            ['password' => 'Clave-Nueva-123'],
            ['sucursal_id' => Sucursal::firstOrFail()->id],
            ['rol_id' => Rol::where('nombre', 'administrador')->value('id')],
            ['activo' => false],
        ] as $payload) {
            $this->putJson("/api/usuarios/{$this->clienteA->id}", $payload)->assertStatus(403);
        }

        $a = $this->clienteA->fresh();
        $this->assertSame('a@prueba.test', $a->email);
        $this->assertNull($a->sucursal_id);
        $this->assertTrue($a->activo);
        $this->assertTrue(Hash::check('Clave-Original-1', $a->password));
        $this->assertSame('cliente', $a->rol->nombre);
    }

    public function test_empleado_puede_editar_su_perfil_pero_no_el_de_otros()
    {
        Sanctum::actingAs($this->empleado);

        $this->putJson("/api/usuarios/{$this->empleado->id}", ['telefono' => '+593 98 000 0000'])->assertOk();
        $this->assertSame('+593 98 000 0000', $this->empleado->fresh()->telefono);

        $this->putJson("/api/usuarios/{$this->clienteA->id}", ['nombre' => 'X'])->assertStatus(403);
    }

    public function test_administrador_puede_modificar_a_otros_incluidos_correo_estado_y_contrasena()
    {
        Sanctum::actingAs($this->admin);

        $this->putJson("/api/usuarios/{$this->clienteA->id}", [
            'email' => 'nuevo@prueba.test',
            'activo' => false,
            'password' => 'Clave-Restablecida-7',
        ])->assertOk();

        $a = $this->clienteA->fresh();
        $this->assertSame('nuevo@prueba.test', $a->email);
        $this->assertFalse($a->activo);
        $this->assertTrue(Hash::check('Clave-Restablecida-7', $a->password));
    }

    public function test_administrador_no_cambia_su_propia_contrasena_por_este_endpoint()
    {
        Sanctum::actingAs($this->admin);

        $this->putJson("/api/usuarios/{$this->admin->id}", ['password' => 'Clave-Nueva-123'])->assertStatus(403);

        $this->assertTrue(Hash::check('Clave-Original-1', $this->admin->fresh()->password));
    }
}
