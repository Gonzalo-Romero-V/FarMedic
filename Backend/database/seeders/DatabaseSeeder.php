<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Seeds esenciales (fijos del sistema). Datos transaccionales se agregan luego.

        DB::table('roles')->upsert([
            ['id' => 1, 'nombre' => 'administrador', 'descripcion' => 'Acceso total al sistema', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'nombre' => 'empleado',      'descripcion' => 'POS, gestión de pedidos e inventario limitado', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'nombre' => 'cliente',       'descripcion' => 'Catálogo y pedidos online propios', 'created_at' => now(), 'updated_at' => now()],
        ], ['id'], ['nombre', 'descripcion', 'updated_at']);
    }
}
