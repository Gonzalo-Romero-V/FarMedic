<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Farmacia extends Model
{
    protected $table = 'farmacias';

    protected $fillable = [
        'nombre',
        'ruc',
        'logo_url',
        'iva_tasa',
        'telefono_contacto',
        'email_contacto',
    ];

    protected function casts(): array
    {
        return [
            'iva_tasa' => 'decimal:2',
        ];
    }

    public function sucursales(): HasMany
    {
        return $this->hasMany(Sucursal::class);
    }
}
