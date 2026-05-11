<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lote extends Model
{
    protected $table = 'lotes';

    // cantidad_actual NO va en fillable: se controla vía MovimientoStock (Kardex).
    protected $fillable = [
        'medicamento_id',
        'sucursal_id',
        'proveedor_id',
        'numero_lote',
        'fecha_vencimiento',
        'fecha_ingreso',
        'cantidad_inicial',
        'costo_unitario',
    ];

    protected function casts(): array
    {
        return [
            'fecha_vencimiento' => 'date',
            'fecha_ingreso' => 'date',
            'cantidad_inicial' => 'integer',
            'cantidad_actual' => 'integer',
            'costo_unitario' => 'decimal:2',
        ];
    }

    public function medicamento(): BelongsTo
    {
        return $this->belongsTo(Medicamento::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function proveedor(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class);
    }

    public function movimientosStock(): HasMany
    {
        return $this->hasMany(MovimientoStock::class);
    }

    public function ventaItems(): HasMany
    {
        return $this->hasMany(VentaItem::class);
    }

    public function pedidoItems(): HasMany
    {
        return $this->hasMany(PedidoItem::class);
    }

    /**
     * Estado computado: vigente | proximo_a_vencer | vencido.
     * Umbral de "próximo a vencer": 30 días.
     */
    protected function estado(): Attribute
    {
        return Attribute::make(
            get: function () {
                $hoy = Carbon::today();
                $venc = Carbon::parse($this->fecha_vencimiento);
                if ($venc->lt($hoy)) {
                    return 'vencido';
                }
                if ($venc->lte($hoy->copy()->addDays(30))) {
                    return 'proximo_a_vencer';
                }
                return 'vigente';
            }
        );
    }
}
