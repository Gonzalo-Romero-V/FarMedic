<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Pedido extends Model
{
    protected $table = 'pedidos';

    protected $fillable = [
        'sucursal_id',
        'cliente_id',
        'usuario_id_gestor',
        'receta_id',
        'numero_pedido',
        'tipo_entrega',
        'direccion_envio',
        'telefono_contacto',
        'estado',
        'subtotal',
        'iva_tasa_aplicada',
        'impuesto_total',
        'total',
        'fecha_solicitud',
        'fecha_envio',
        'fecha_entrega',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'iva_tasa_aplicada' => 'decimal:2',
            'impuesto_total' => 'decimal:2',
            'total' => 'decimal:2',
            'fecha_solicitud' => 'datetime',
            'fecha_envio' => 'datetime',
            'fecha_entrega' => 'datetime',
        ];
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'cliente_id');
    }

    public function gestor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id_gestor');
    }

    public function receta(): BelongsTo
    {
        return $this->belongsTo(Receta::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PedidoItem::class);
    }

    public function movimientosStock(): MorphMany
    {
        return $this->morphMany(MovimientoStock::class, 'referencia', 'referencia_tipo', 'referencia_id');
    }
}
