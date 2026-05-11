<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rol;

/**
 * Roles son fijos del sistema (administrador, empleado, cliente).
 * Solo se exponen como recurso de consulta — no se crean/editan/eliminan via API.
 */
class RolController extends Controller
{
    public function index()
    {
        return Rol::orderBy('id')->get();
    }
}
