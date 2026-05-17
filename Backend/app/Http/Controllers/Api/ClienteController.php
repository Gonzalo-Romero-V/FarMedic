<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pedido;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Endpoints agregados para el rol cliente. Scope: SIEMPRE filtrado por el cliente
 * autenticado (auth()->user()->id). Alineado con [[rbac]] permiso `orders.read.own`.
 *
 * Decisiones:
 *   - Catálogo cliente: stock_disponible = SUM(lote.cantidad_actual vigentes) entre
 *     TODAS las sucursales activas. El cliente luego elige a qué sucursal le pide
 *     en el checkout (selector). El backend valida stock en esa sucursal al confirmar.
 *   - Dashboard: KPIs por estado del pedido ([[pedido]] enum pendiente|en_camino|entregado|cancelado).
 *   - No expone telefono/direccion de otros usuarios (RNF-04). El cliente sí ve los suyos
 *     en /perfil (endpoint separado, fuera de esta tanda).
 */
class ClienteController extends Controller
{
    private const LIST_LIMIT = 8;
    private const PER_PAGE_DEFAULT = 25;

    public function dashboard(Request $request)
    {
        $user = $request->user();
        abort_unless($user->esCliente(), 403, 'Solo clientes');

        $base = Pedido::where('cliente_id', $user->id);

        $kpis = [
            'pedidos_pendientes' => (clone $base)->where('estado', 'pendiente')->count(),
            'pedidos_en_camino' => (clone $base)->where('estado', 'en_camino')->count(),
            'pedidos_entregados' => (clone $base)->where('estado', 'entregado')->count(),
            'total_gastado' => (float) (clone $base)->where('estado', 'entregado')->sum('total'),
        ];

        $pedidosRecientes = (clone $base)
            ->with(['sucursal:id,nombre'])
            ->orderByDesc('fecha_solicitud')
            ->limit(self::LIST_LIMIT)
            ->get(['id', 'numero_pedido', 'sucursal_id', 'estado', 'tipo_entrega', 'total', 'fecha_solicitud']);

        return [
            'kpis' => $kpis,
            'pedidos_recientes' => $pedidosRecientes,
        ];
    }

    /**
     * Catálogo navegable por el cliente. Devuelve medicamentos con stock disponible
     * agregado (suma de lotes vigentes en sucursales activas). La sucursal específica
     * la elige el cliente en el checkout.
     */
    public function catalogo(Request $request)
    {
        $q = DB::table('medicamentos')
            ->leftJoin('lotes', function ($join) {
                $join->on('lotes.medicamento_id', '=', 'medicamentos.id')
                    ->whereRaw('lotes.cantidad_actual > 0')
                    ->whereRaw('lotes.fecha_vencimiento >= CURRENT_DATE');
            })
            ->join('sucursales', 'sucursales.id', '=', 'medicamentos.sucursal_id')
            ->join('categorias', 'categorias.id', '=', 'medicamentos.categoria_id')
            ->whereNull('medicamentos.deleted_at')
            ->where('medicamentos.activo', true)
            ->where('sucursales.activa', true)
            ->groupBy([
                'medicamentos.id',
                'medicamentos.nombre_comercial',
                'medicamentos.principio_activo',
                'medicamentos.codigo_barras',
                'medicamentos.precio',
                'medicamentos.requiere_receta',
                'categorias.id',
                'categorias.nombre',
            ])
            ->select([
                'medicamentos.id',
                'medicamentos.nombre_comercial',
                'medicamentos.principio_activo',
                'medicamentos.codigo_barras',
                'medicamentos.precio',
                'medicamentos.requiere_receta',
                'categorias.id as categoria_id',
                'categorias.nombre as categoria_nombre',
                DB::raw('COALESCE(SUM(lotes.cantidad_actual), 0) AS stock_disponible'),
            ])
            ->havingRaw('COALESCE(SUM(lotes.cantidad_actual), 0) > 0');

        if ($request->filled('categoria_id')) {
            $q->where('medicamentos.categoria_id', $request->categoria_id);
        }
        if ($request->filled('q')) {
            $term = '%' . $request->q . '%';
            $q->where(function ($qq) use ($term) {
                $qq->where('medicamentos.nombre_comercial', 'ilike', $term)
                    ->orWhere('medicamentos.principio_activo', 'ilike', $term)
                    ->orWhere('medicamentos.codigo_barras', 'ilike', $term);
            });
        }
        if ($request->boolean('solo_sin_receta')) {
            $q->where('medicamentos.requiere_receta', false);
        }

        return $q->orderBy('medicamentos.nombre_comercial')
            ->paginate($request->integer('per_page', self::PER_PAGE_DEFAULT));
    }

    /**
     * Stock disponible de un medicamento por sucursal — usado en el checkout
     * cuando el cliente elige una sucursal y queremos confirmar que esa sucursal
     * tiene stock del item del carrito.
     */
    public function stockPorSucursal(Request $request, int $medicamentoId)
    {
        $rows = DB::table('lotes')
            ->join('sucursales', 'sucursales.id', '=', 'lotes.sucursal_id')
            ->where('lotes.medicamento_id', $medicamentoId)
            ->where('lotes.cantidad_actual', '>', 0)
            ->whereRaw('lotes.fecha_vencimiento >= CURRENT_DATE')
            ->where('sucursales.activa', true)
            ->groupBy('sucursales.id', 'sucursales.nombre', 'sucursales.ciudad')
            ->select([
                'sucursales.id as sucursal_id',
                'sucursales.nombre',
                'sucursales.ciudad',
                DB::raw('SUM(lotes.cantidad_actual) AS stock'),
            ])
            ->orderBy('sucursales.nombre')
            ->get();

        return $rows;
    }
}
