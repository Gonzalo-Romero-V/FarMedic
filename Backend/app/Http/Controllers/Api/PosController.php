<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Endpoints livianos para el módulo POS (Punto de Venta) del empleado.
 *
 * No reutilizamos /api/medicamentos (público) ni /api/admin/inventario/medicamentos
 * (scope global admin) porque el POS necesita un cruce específico:
 *   - filtrado por sucursal del usuario autenticado (no global)
 *   - stock_actual agregado de lotes vigentes (no del catálogo plano)
 *   - shape mínimo para mantener la búsqueda en tiempo real ligera
 */
class PosController extends Controller
{
    private const SEARCH_LIMIT = 20;

    /**
     * Busca medicamentos con stock vigente en la sucursal del usuario.
     * Devuelve solo lo necesario para el carrito: id, nombre, principio, código,
     * precio, stock_actual y flag de receta.
     */
    public function medicamentos(Request $request)
    {
        $user = $request->user();
        abort_if($user->sucursal_id === null, 422, 'Usuario sin sucursal asignada');

        $q = DB::table('medicamentos')
            ->leftJoin('lotes', function ($join) {
                $join->on('lotes.medicamento_id', '=', 'medicamentos.id')
                    ->whereRaw('lotes.cantidad_actual > 0')
                    ->whereRaw('lotes.fecha_vencimiento >= CURRENT_DATE');
            })
            ->whereNull('medicamentos.deleted_at')
            ->where('medicamentos.activo', true)
            ->where('medicamentos.sucursal_id', $user->sucursal_id)
            ->groupBy([
                'medicamentos.id',
                'medicamentos.nombre_comercial',
                'medicamentos.principio_activo',
                'medicamentos.codigo_barras',
                'medicamentos.precio',
                'medicamentos.requiere_receta',
            ])
            ->select([
                'medicamentos.id',
                'medicamentos.nombre_comercial',
                'medicamentos.principio_activo',
                'medicamentos.codigo_barras',
                'medicamentos.precio',
                'medicamentos.requiere_receta',
                DB::raw('COALESCE(SUM(lotes.cantidad_actual), 0) AS stock_actual'),
            ])
            ->havingRaw('COALESCE(SUM(lotes.cantidad_actual), 0) > 0');

        if ($request->filled('q')) {
            $term = '%' . $request->q . '%';
            $q->where(function ($qq) use ($term) {
                $qq->where('medicamentos.nombre_comercial', 'ilike', $term)
                    ->orWhere('medicamentos.principio_activo', 'ilike', $term)
                    ->orWhere('medicamentos.codigo_barras', 'ilike', $term);
            });
        }

        return $q->orderBy('medicamentos.nombre_comercial')
            ->limit(self::SEARCH_LIMIT)
            ->get()
            ->map(fn ($r) => [
                'id' => (int) $r->id,
                'nombre_comercial' => $r->nombre_comercial,
                'principio_activo' => $r->principio_activo,
                'codigo_barras' => $r->codigo_barras,
                'precio' => (float) $r->precio,
                'requiere_receta' => (bool) $r->requiere_receta,
                'stock_actual' => (int) $r->stock_actual,
            ]);
    }

    /**
     * Autocompletar de clientes registrados para asociar a la venta.
     * Devuelve solo {id, nombre, email} — teléfono y dirección son privados
     * (decisions/rbac.md, domain/cliente.md RNF-04).
     */
    public function clientes(Request $request)
    {
        $term = trim((string) $request->query('q', ''));

        $q = Usuario::clientes()
            ->where('activo', true)
            ->select(['id', 'nombre', 'email'])
            ->orderBy('nombre')
            ->limit(self::SEARCH_LIMIT);

        if ($term !== '') {
            $like = '%' . $term . '%';
            $q->where(function ($qq) use ($like) {
                $qq->where('nombre', 'ilike', $like)
                    ->orWhere('email', 'ilike', $like);
            });
        }

        return $q->get();
    }
}
