<?php

namespace Tests\Feature;

use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * RS-14: el sistema solo expone rutas útiles; se cierran las que registran los paquetes
 * y no se usan (/sanctum/csrf-cookie y storage/{path}, que serviría el disco privado).
 */
class SuperficieRutasTest extends TestCase
{
    use RefreshDatabase;

    public function test_la_ruta_de_cookie_csrf_de_sanctum_responde_404()
    {
        $this->getJson('/sanctum/csrf-cookie')->assertNotFound();
    }

    public function test_la_ruta_que_serviria_el_disco_privado_responde_404()
    {
        $this->get('/storage/recetas/cualquiera.jpg')->assertNotFound();
        $this->put('/storage/recetas/cualquiera.jpg')->assertStatus(404);
    }

    public function test_ninguna_ruta_registrada_expone_esas_rutas()
    {
        $uris = collect(Route::getRoutes()->getRoutes())->map(fn ($r) => $r->uri())->all();

        $this->assertNotContains('sanctum/csrf-cookie', $uris);
        $this->assertNotContains('storage/{path}', $uris);
    }

    public function test_el_ingreso_y_las_rutas_autenticadas_siguen_funcionando()
    {
        DB::table('roles')->insert([
            ['id' => 3, 'nombre' => 'cliente', 'descripcion' => 'Cliente', 'created_at' => now(), 'updated_at' => now()],
        ]);
        Usuario::create([
            'rol_id' => 3, 'nombre' => 'Cliente', 'email' => 'cliente@prueba.test',
            'password' => 'Clave-Robusta-123', 'activo' => true,
        ]);

        $token = $this->postJson('/api/auth/login', ['email' => 'cliente@prueba.test', 'password' => 'Clave-Robusta-123'])
            ->assertOk()->json('token');

        $this->withToken($token)->getJson('/api/auth/me')->assertOk();
        $this->getJson('/up')->assertOk();
    }
}
