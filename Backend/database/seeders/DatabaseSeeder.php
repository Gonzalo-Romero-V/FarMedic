<?php

namespace Database\Seeders;

use App\Models\Farmacia;
use App\Models\Rol;
use App\Models\Sucursal;
use App\Models\Usuario;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Roles (fijos del sistema).
        DB::table('roles')->upsert([
            ['id' => 1, 'nombre' => 'administrador', 'descripcion' => 'Acceso total al sistema', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'nombre' => 'empleado',      'descripcion' => 'POS, gestión de pedidos e inventario limitado', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'nombre' => 'cliente',       'descripcion' => 'Catálogo y pedidos online propios', 'created_at' => now(), 'updated_at' => now()],
        ], ['id'], ['nombre', 'descripcion', 'updated_at']);

        // Farmacia raíz + sucursal central (mínimo viable para que el admin pueda existir).
        $farmacia = Farmacia::firstOrCreate(
            ['ruc' => '1791234567001'],
            [
                'nombre' => 'FarMedic',
                'logo_url' => null,
                'iva_tasa' => 15.00,
                'telefono_contacto' => '+593 99 000 0000',
                'email_contacto' => 'contacto@farmedic.local',
            ]
        );

        $sucursal = Sucursal::firstOrCreate(
            ['farmacia_id' => $farmacia->id, 'nombre' => 'Matriz'],
            [
                'ciudad' => 'Riobamba',
                'direccion' => 'Av. Daniel León Borja s/n',
                'telefono' => '+593 32 000 000',
                'activa' => true,
            ]
        );

        // Admin inicial — credenciales de dev (rotar en producción).
        // Ver vault/decisions/auth.md sección "Credenciales de desarrollo".
        Usuario::firstOrCreate(
            ['email' => 'admin@farmedic.local'],
            [
                'rol_id' => 1,
                'sucursal_id' => $sucursal->id,
                'nombre' => 'Admin FarMedic',
                'password' => Hash::make('FarMedic2026!'),
                'telefono' => null,
                'direccion' => null,
                'activo' => true,
            ]
        );

        $this->call(CatalogoSeeder::class);
    }
}
