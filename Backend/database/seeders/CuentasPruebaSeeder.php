<?php

namespace Database\Seeders;

use App\Models\Farmacia;
use App\Models\Medicamento;
use App\Models\Pedido;
use App\Models\PedidoItem;
use App\Models\Rol;
use App\Models\Sucursal;
use App\Models\Usuario;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Cuatro cuentas de prueba (administrador, empleado, cliente A, cliente B) y un
 * pedido a domicilio activo del cliente A en la sucursal del empleado.
 *
 * Correos y contraseñas salen de config/cuentas_prueba.php (variables
 * SEED_TEST_*). Si falta cualquiera, no se crea nada. Es idempotente: se
 * identifica por correo y por el pedido activo, así que puede correr en cada
 * deploy. Reemplazar una cuenta es cambiar sus variables; la cuenta anterior
 * queda y se desactiva a mano.
 */
class CuentasPruebaSeeder extends Seeder
{
    private const SUCURSAL = 'Matriz';

    public function run(): void
    {
        $cuentas = config('cuentas_prueba');

        foreach ($cuentas as $clave => $valores) {
            if (empty($valores['email']) || empty($valores['password'])) {
                $this->aviso("Cuentas de prueba omitidas: falta el correo o la contraseña de '{$clave}' (SEED_TEST_*).");
                return;
            }
        }

        $sucursal = Sucursal::where('nombre', self::SUCURSAL)->first();
        if (! $sucursal) {
            $this->aviso('Cuentas de prueba omitidas: no existe la sucursal ' . self::SUCURSAL . '.');
            return;
        }

        $rol = fn (string $nombre) => Rol::where('nombre', $nombre)->value('id');

        $this->cuenta($cuentas['admin'], 'Prueba Administrador', $rol('administrador'), $sucursal->id);
        $this->cuenta($cuentas['empleado'], 'Prueba Empleado', $rol('empleado'), $sucursal->id);
        $clienteA = $this->cuenta($cuentas['cliente_a'], 'Prueba Cliente A', $rol('cliente'), null, [
            'telefono' => '+593 90 000 0001',
            'direccion' => 'Calle de prueba A 100',
        ]);
        $this->cuenta($cuentas['cliente_b'], 'Prueba Cliente B', $rol('cliente'), null, [
            'telefono' => '+593 90 000 0002',
            'direccion' => 'Calle de prueba B 200',
        ]);

        $this->pedidoDomicilio($clienteA, $sucursal);
    }

    private function cuenta(array $valores, string $nombre, int $rolId, ?int $sucursalId, array $extra = []): Usuario
    {
        return Usuario::updateOrCreate(
            ['email' => $valores['email']],
            array_merge([
                'rol_id' => $rolId,
                'sucursal_id' => $sucursalId,
                'nombre' => $nombre,
                'password' => Hash::make($valores['password']),
                'activo' => true,
            ], $extra)
        );
    }

    /**
     * Pedido a domicilio pendiente del cliente en la sucursal. Solo se crea si
     * no hay ya uno activo. No reserva lotes ni mueve stock.
     */
    private function pedidoDomicilio(Usuario $cliente, Sucursal $sucursal): void
    {
        $existe = Pedido::where('cliente_id', $cliente->id)
            ->where('sucursal_id', $sucursal->id)
            ->where('tipo_entrega', 'domicilio')
            ->whereIn('estado', ['pendiente', 'en_camino'])
            ->exists();
        if ($existe) {
            return;
        }

        $medicamento = Medicamento::where('sucursal_id', $sucursal->id)->where('activo', true)->orderBy('id')->first();
        if (! $medicamento) {
            $this->aviso('Pedido de prueba omitido: no hay medicamentos activos en ' . $sucursal->nombre . '.');
            return;
        }

        $iva = (float) Farmacia::value('iva_tasa');
        $subtotal = round((float) $medicamento->precio, 2);
        $impuesto = round($subtotal * $iva / 100, 2);

        $ultimo = Pedido::where('sucursal_id', $sucursal->id)->orderByDesc('id')->value('numero_pedido');
        $numero = str_pad((string) (((int) $ultimo) + 1), 7, '0', STR_PAD_LEFT);

        $pedido = Pedido::create([
            'sucursal_id' => $sucursal->id,
            'cliente_id' => $cliente->id,
            'receta_id' => null,
            'numero_pedido' => $numero,
            'tipo_entrega' => 'domicilio',
            'direccion_envio' => $cliente->direccion,
            'telefono_contacto' => $cliente->telefono,
            'estado' => 'pendiente',
            'subtotal' => $subtotal,
            'iva_tasa_aplicada' => $iva,
            'impuesto_total' => $impuesto,
            'total' => $subtotal + $impuesto,
            'fecha_solicitud' => now(),
        ]);

        PedidoItem::create([
            'pedido_id' => $pedido->id,
            'medicamento_id' => $medicamento->id,
            'lote_id' => null,
            'cantidad' => 1,
            'precio_unitario' => $subtotal,
            'subtotal' => $subtotal,
        ]);
    }

    private function aviso(string $mensaje): void
    {
        if ($this->command) {
            $this->command->warn($mensaje);
        }
    }
}
