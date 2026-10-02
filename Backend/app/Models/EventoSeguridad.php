<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * RS-15. Un evento de seguridad: quién (usuario, nullable), sobre quién (objetivo, nullable),
 * qué (acción), con qué resultado, desde dónde (IP, agente) y cuándo. Solo se inserta.
 */
class EventoSeguridad extends Model
{
    public const UPDATED_AT = null;

    protected $table = 'eventos_seguridad';

    protected $fillable = [
        'usuario_id',
        'objetivo_id',
        'accion',
        'resultado',
        'ip',
        'agente',
        'detalle',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function objetivo(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'objetivo_id');
    }
}
