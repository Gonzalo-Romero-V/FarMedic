<?php

namespace App\Policies;

use App\Models\Usuario;

/**
 * Autorización sobre registros de usuarios (RS-01; RS-02 reutiliza esta clase).
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
}
