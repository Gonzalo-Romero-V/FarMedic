<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Receta extends Model
{
    protected $table = 'recetas';

    protected $fillable = [
        'numero',
        'imagen_url',
        'doctor',
        'fecha_emision',
        'observaciones',
    ];

    protected function casts(): array
    {
        return [
            'fecha_emision' => 'date',
        ];
    }

    public function venta(): HasOne
    {
        return $this->hasOne(Venta::class);
    }

    public function pedido(): HasOne
    {
        return $this->hasOne(Pedido::class);
    }
}
