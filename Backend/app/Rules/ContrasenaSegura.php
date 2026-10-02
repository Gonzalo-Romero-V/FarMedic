<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * RS-07. Rechaza contraseñas de menos de 8 caracteres y las que figuran en la lista
 * local de las 10 000 contraseñas más comunes (resources/security/contrasenas-comunes.txt,
 * fuente: SecLists «10k-most-common», licencia MIT). La lista es local para que la
 * comprobación sea reproducible sin conexión a internet. Comparación sin distinguir
 * mayúsculas.
 */
class ContrasenaSegura implements ValidationRule
{
    public const LONGITUD_MINIMA = 8;

    /** @var array<string, true>|null */
    private static ?array $comunes = null;

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || mb_strlen($value) < self::LONGITUD_MINIMA) {
            $fail('La contraseña debe tener al menos ' . self::LONGITUD_MINIMA . ' caracteres.');
            return;
        }

        if (isset(self::comunes()[mb_strtolower($value)])) {
            $fail('La contraseña es demasiado común; elige otra.');
        }
    }

    /** @return array<string, true> */
    private static function comunes(): array
    {
        if (self::$comunes === null) {
            $lineas = file(resource_path('security/contrasenas-comunes.txt'), FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
            self::$comunes = array_fill_keys(array_map('mb_strtolower', array_map('trim', $lineas)), true);
        }

        return self::$comunes;
    }
}
