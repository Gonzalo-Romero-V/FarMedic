<?php

/*
| Contraseña del administrador inicial (admin@farmedic.local) que siembra
| DatabaseSeeder. Sin valor por defecto: si SEED_ADMIN_PASSWORD no está
| definida, el seeder no crea el admin. Se lee desde config() porque
| `config:cache` anula env() fuera de los archivos de configuración.
*/

return [
    'password' => env('SEED_ADMIN_PASSWORD'),
];
