<?php

namespace App\Policies;

use App\Models\Pedido;
use App\Models\Usuario;

/**
 * Autorización sobre registros de usuarios (RS-01 y RS-02).
 */
class UsuarioPolicy
{
    /**
     * Modificar un usuario: solo el administrador, o el propietario sobre su
     * propio registro. Qué campos puede tocar cada uno lo decide el controlador.
     */
    public function update(Usuario $actor, Usuario $objetivo): bool
    {
        return $actor->esAdministrador() || $actor->id === $objetivo->id;
    }

    /**
     * Consultar el registro completo: administrador o propietario.
     */
    public function view(Usuario $actor, Usuario $objetivo): bool
    {
        return $actor->esAdministrador() || $actor->id === $objetivo->id;
    }

    /**
     * Consultar solo teléfono y dirección de un cliente: el empleado, y únicamente
     * si el cliente tiene un pedido activo (pendiente o en camino) con entrega a
     * domicilio en la sucursal del empleado.
     */
    public function verContactoEntrega(Usuario $actor, Usuario $objetivo): bool
    {
        if (! $actor->esEmpleado() || ! $objetivo->esCliente() || $actor->sucursal_id === null) {
            return false;
        }

        return Pedido::where('cliente_id', $objetivo->id)
            ->where('sucursal_id', $actor->sucursal_id)
            ->where('tipo_entrega', 'domicilio')
            ->whereIn('estado', ['pendiente', 'en_camino'])
            ->exists();
    }
}
