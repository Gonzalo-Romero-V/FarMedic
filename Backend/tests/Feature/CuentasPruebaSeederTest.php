<?php

namespace Tests\Feature;

use App\Models\Pedido;
use App\Models\Usuario;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CuentasPruebaSeederTest extends TestCase
{
    use RefreshDatabase;

    private function configurarCuentas(): void
    {
        config(['cuentas_prueba' => [
            'admin' => ['email' => 'admin.prueba@example.test', 'password' => 'Adm-Prueba-1'],
            'empleado' => ['email' => 'empleado.prueba@example.test', 'password' => 'Emp-Prueba-2'],
            'cliente_a' => ['email' => 'cliente.a@example.test', 'password' => 'CliA-Prueba-3'],
            'cliente_b' => ['email' => 'cliente.b@example.test', 'password' => 'CliB-Prueba-4'],
        ]]);
    }

    public function test_sin_variables_no_crea_cuentas_de_prueba()
    {
        config(['cuentas_prueba' => [
            'admin' => ['email' => null, 'password' => null],
            'empleado' => ['email' => null, 'password' => null],
            'cliente_a' => ['email' => null, 'password' => null],
            'cliente_b' => ['email' => null, 'password' => null],
        ]]);

        $this->seed(DatabaseSeeder::class);

        $this->assertSame(0, Usuario::where('email', 'like', '%@example.test')->count());
        $this->assertSame(0, Pedido::count());
    }

    public function test_con_variables_crea_las_cuatro_cuentas_y_el_pedido_a_domicilio()
    {
        $this->configurarCuentas();

        $this->seed(DatabaseSeeder::class);

        $empleado = Usuario::with('rol')->where('email', 'empleado.prueba@example.test')->firstOrFail();
        $this->assertSame('empleado', $empleado->rol->nombre);
        $this->assertNotNull($empleado->sucursal_id);
        $this->assertTrue(Hash::check('Emp-Prueba-2', $empleado->password));

        $clienteA = Usuario::with('rol')->where('email', 'cliente.a@example.test')->firstOrFail();
        $clienteB = Usuario::with('rol')->where('email', 'cliente.b@example.test')->firstOrFail();
        $this->assertSame('cliente', $clienteA->rol->nombre);
        $this->assertSame('cliente', $clienteB->rol->nombre);
        $this->assertNotSame($clienteA->id, $clienteB->id);
        $this->assertSame('administrador', Usuario::with('rol')->where('email', 'admin.prueba@example.test')->firstOrFail()->rol->nombre);

        $pedido = Pedido::where('cliente_id', $clienteA->id)->firstOrFail();
        $this->assertSame('domicilio', $pedido->tipo_entrega);
        $this->assertSame('pendiente', $pedido->estado);
        $this->assertSame($empleado->sucursal_id, $pedido->sucursal_id);
    }

    public function test_es_idempotente_y_aplica_el_cambio_de_contrasena()
    {
        $this->configurarCuentas();
        $this->seed(DatabaseSeeder::class);

        config(['cuentas_prueba.cliente_a.password' => 'CliA-Nueva-9']);
        $this->seed(DatabaseSeeder::class);

        $this->assertSame(4, Usuario::where('email', 'like', '%@example.test')->count());
        $this->assertSame(1, Pedido::count());
        $clienteA = Usuario::where('email', 'cliente.a@example.test')->firstOrFail();
        $this->assertTrue(Hash::check('CliA-Nueva-9', $clienteA->password));
    }
}
