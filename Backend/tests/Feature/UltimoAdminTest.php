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
 * RS-05: no se puede desactivar al último administrador activo (422), por ningún camino.
 */
class UltimoAdminTest extends TestCase
{
    use RefreshDatabase;

    private Usuario $admin;
    private int $sucursalId;

    protected function setUp(): void
    {
        parent::setUp();
        config(['admin_inicial.password' => null]);
        $this->seed(DatabaseSeeder::class);

        $this->sucursalId = Sucursal::firstOrFail()->id;
        $this->admin = $this->crearAdmin('admin1@prueba.test');
    }

    private function crearAdmin(string $email): Usuario
    {
        return Usuario::create([
            'rol_id' => Rol::where('nombre', 'administrador')->value('id'),
            'sucursal_id' => $this->sucursalId,
            'nombre' => 'Admin',
            'email' => $email,
            'password' => 'Clave-Original-1',
            'activo' => true,
        ]);
    }

    public function test_el_unico_admin_activo_no_puede_desactivarse_con_delete()
    {
        Sanctum::actingAs($this->admin);

        $this->deleteJson("/api/usuarios/{$this->admin->id}")->assertStatus(422);

        $this->assertTrue($this->admin->fresh()->activo);
    }

    public function test_el_unico_admin_activo_no_puede_desactivarse_con_put()
    {
        Sanctum::actingAs($this->admin);

        $this->putJson("/api/usuarios/{$this->admin->id}", ['activo' => false])->assertStatus(422);

        $this->assertTrue($this->admin->fresh()->activo);
    }

    public function test_con_dos_admins_uno_puede_desactivarse_por_cualquier_camino()
    {
        $otro = $this->crearAdmin('admin2@prueba.test');
        $tercero = $this->crearAdmin('admin3@prueba.test');
        Sanctum::actingAs($this->admin);

        $this->deleteJson("/api/usuarios/{$otro->id}")->assertNoContent();
        $this->assertFalse($otro->fresh()->activo);

        $this->putJson("/api/usuarios/{$tercero->id}", ['activo' => false])->assertOk();
        $this->assertFalse($tercero->fresh()->activo);
    }

    public function test_si_los_otros_admins_estan_inactivos_el_ultimo_activo_sigue_protegido()
    {
        $otro = $this->crearAdmin('admin2@prueba.test');
        $otro->update(['activo' => false]);
        Sanctum::actingAs($this->admin);

        $this->deleteJson("/api/usuarios/{$this->admin->id}")->assertStatus(422);
    }

    public function test_desactivar_a_un_empleado_no_se_ve_afectado()
    {
        $empleado = Usuario::create([
            'rol_id' => Rol::where('nombre', 'empleado')->value('id'),
            'sucursal_id' => $this->sucursalId,
            'nombre' => 'Empleado', 'email' => 'emp@prueba.test',
            'password' => 'Clave-Original-1', 'activo' => true,
        ]);
        Sanctum::actingAs($this->admin);

        $this->deleteJson("/api/usuarios/{$empleado->id}")->assertNoContent();
    }
}
