<?php

/*
|--------------------------------------------------------------------------
| Cuentas de prueba (CuentasPruebaSeeder)
|--------------------------------------------------------------------------
| Todos los valores vienen del entorno; ninguno se versiona. Si falta
| cualquiera de los ocho, el seeder no crea nada. Se lee desde config()
| (y no con env() en el seeder) porque `config:cache` anula env() fuera
| de los archivos de configuración.
*/

return [
    'admin' => [
        'email' => env('SEED_TEST_ADMIN_EMAIL'),
        'password' => env('SEED_TEST_ADMIN_PASSWORD'),
    ],
    'empleado' => [
        'email' => env('SEED_TEST_EMPLEADO_EMAIL'),
        'password' => env('SEED_TEST_EMPLEADO_PASSWORD'),
    ],
    'cliente_a' => [
        'email' => env('SEED_TEST_CLIENTE_A_EMAIL'),
        'password' => env('SEED_TEST_CLIENTE_A_PASSWORD'),
    ],
    'cliente_b' => [
        'email' => env('SEED_TEST_CLIENTE_B_EMAIL'),
        'password' => env('SEED_TEST_CLIENTE_B_PASSWORD'),
    ],
];
