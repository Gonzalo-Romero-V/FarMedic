<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Venta extends Model
{
    protected $table = 'ventas';

    protected $fillable = [
        'sucursal_id',
        'usuario_id',
        'cliente_id',
        'receta_id',
        'numero_comprobante',
        'subtotal',
        'descuento_total',
        'iva_tasa_aplicada',
        'impuesto_total',
        'total',
        'metodo_pago',
        'estado',
        'comprobante_pdf_url',
        'fecha',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'descuento_total' => 'decimal:2',
            'iva_tasa_aplicada' => 'decimal:2',
            'impuesto_total' => 'decimal:2',
            'total' => 'decimal:2',
            'fecha' => 'datetime',
        ];
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'cliente_id');
    }

    public function receta(): BelongsTo
    {
        return $this->belongsTo(Receta::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(VentaItem::class);
    }

    public function movimientosStock(): MorphMany
    {
        return $this->morphMany(MovimientoStock::class, 'referencia', 'referencia_tipo', 'referencia_id');
    }
}
