<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class MovimientoStock extends Model
{
    protected $table = 'movimientos_stock';

    // Kardex es inmutable y solo tiene created_at en BD.
    public $timestamps = false;

    protected $fillable = [
        'lote_id',
        'sucursal_id',
        'usuario_id',
        'tipo',
        'cantidad',
        'referencia_tipo',
        'referencia_id',
        'justificacion',
    ];

    protected function casts(): array
    {
        return [
            'cantidad' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function lote(): BelongsTo
    {
        return $this->belongsTo(Lote::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class);
    }

    /**
     * Polimórfico: apunta a Venta o Pedido vía columnas referencia_tipo + referencia_id.
     */
    public function referencia(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'referencia_tipo', 'referencia_id');
    }
}
