<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Proyección mínima de un cliente para el empleado que gestiona su entrega (RS-02):
 * nombre, teléfono y dirección; nada más.
 */
class ContactoEntregaResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'nombre' => $this->nombre,
            'telefono' => $this->telefono,
            'direccion' => $this->direccion,
        ];
    }
}
