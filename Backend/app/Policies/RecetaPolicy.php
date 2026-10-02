<?php

namespace App\Policies;

use App\Models\Pedido;
use App\Models\Receta;
use App\Models\Usuario;
use App\Models\Venta;

/**
 * RS-03. La receta no guarda propietario: se deriva de la venta o el pedido que la
 * referencia (cliente y sucursal). El cliente conserva su derecho aunque la venta
 * se anule o el pedido se cancele, porque el vínculo no se borra.
 *
 *  - Administrador: siempre.
 *  - Cliente: si es el cliente de alguna venta o pedido que referencia la receta.
 *  - Empleado: si alguna venta o pedido que la referencia es de su sucursal; y si no
 *    tiene ningún vínculo todavía (el POS crea la receta antes que la venta), cualquier
 *    empleado, nunca un cliente.
 *  - Venta de mostrador sin cliente: solo empleados de esa sucursal y administrador.
 */
class RecetaPolicy
{
    public function view(Usuario $actor, Receta $receta): bool
    {
        if ($actor->esAdministrador()) {
            return true;
        }

        $ventas = Venta::where('receta_id', $receta->id)->get(['sucursal_id', 'cliente_id']);
        $pedidos = Pedido::where('receta_id', $receta->id)->get(['sucursal_id', 'cliente_id']);
        $vinculos = $ventas->concat($pedidos);

        if ($actor->esCliente()) {
            return $vinculos->contains(fn ($v) => $v->cliente_id !== null && $v->cliente_id === $actor->id);
        }

        if ($actor->esEmpleado()) {
            return $vinculos->isEmpty()
                || $vinculos->contains(fn ($v) => $actor->sucursal_id !== null && $v->sucursal_id === $actor->sucursal_id);
        }

        return false;
    }
}
