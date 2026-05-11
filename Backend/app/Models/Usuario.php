<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Usuario extends Authenticatable
{
    use Notifiable;

    protected $table = 'usuarios';

    protected $fillable = [
        'rol_id',
        'sucursal_id',
        'nombre',
        'email',
        'password',
        'google_oauth_id',
        'telefono',
        'direccion',
        'activo',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'activo' => 'boolean',
        ];
    }

    // Relaciones
    public function rol(): BelongsTo
    {
        return $this->belongsTo(Rol::class);
    }

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function ventas(): HasMany
    {
        return $this->hasMany(Venta::class, 'usuario_id');
    }

    public function pedidosGestionados(): HasMany
    {
        return $this->hasMany(Pedido::class, 'usuario_id_gestor');
    }

    public function pedidos(): HasMany
    {
        return $this->hasMany(Pedido::class, 'cliente_id');
    }

    public function movimientosStock(): HasMany
    {
        return $this->hasMany(MovimientoStock::class, 'usuario_id');
    }

    // Helpers de rol
    public function esAdministrador(): bool
    {
        return $this->rol?->nombre === 'administrador';
    }

    public function esEmpleado(): bool
    {
        return $this->rol?->nombre === 'empleado';
    }

    public function esCliente(): bool
    {
        return $this->rol?->nombre === 'cliente';
    }
}
