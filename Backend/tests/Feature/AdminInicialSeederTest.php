<?php

namespace Tests\Feature;

use App\Models\Usuario;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * RS-10: sin credenciales por defecto en el código fuente de la versión vigente.
 */
class AdminInicialSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_sin_variable_no_se_crea_el_admin_inicial()
    {
        config(['admin_inicial.password' => null]);

        $this->seed(DatabaseSeeder::class);

        $this->assertFalse(Usuario::where('email', 'admin@farmedic.local')->exists());
    }

    public function test_con_variable_crea_el_admin_con_esa_contrasena()
    {
        config(['admin_inicial.password' => 'Admin-Inicial-Test-1']);

        $this->seed(DatabaseSeeder::class);

        $admin = Usuario::with('rol')->where('email', 'admin@farmedic.local')->firstOrFail();
        $this->assertSame('administrador', $admin->rol->nombre);
        $this->assertTrue(Hash::check('Admin-Inicial-Test-1', $admin->password));
    }

    public function test_no_pisa_la_contrasena_rotada_de_un_admin_existente()
    {
        config(['admin_inicial.password' => 'Admin-Inicial-Test-1']);
        $this->seed(DatabaseSeeder::class);
        Usuario::where('email', 'admin@farmedic.local')->update(['password' => Hash::make('Rotada-En-Produccion-2')]);

        config(['admin_inicial.password' => 'Admin-Inicial-Test-1']);
        $this->seed(DatabaseSeeder::class);

        $admin = Usuario::where('email', 'admin@farmedic.local')->firstOrFail();
        $this->assertTrue(Hash::check('Rotada-En-Produccion-2', $admin->password));
    }

    public function test_los_seeders_no_contienen_contrasenas_literales()
    {
        foreach (glob(database_path('seeders/*.php')) as $archivo) {
            $this->assertDoesNotMatchRegularExpression(
                '/Hash::make\(\s*[\'"]/',
                file_get_contents($archivo),
                basename($archivo) . ' tiene una contraseña literal en Hash::make()'
            );
        }
    }
}
