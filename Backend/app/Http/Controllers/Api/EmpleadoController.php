<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lote;
use App\Models\MovimientoStock;
use App\Models\Pedido;
use App\Models\Usuario;
use App\Models\Venta;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Endpoints agregados del rol empleado. Scope: SIEMPRE filtrado por la sucursal
 * del usuario autenticado (auth()->user()->sucursal_id). Decisiones / convenciones
 * tomadas del vault:
 *   - rbac.md: empleado tiene permisos *.local; sucursal_id viene de auth, no del body.
 *   - venta.md: estado completada|anulada, descuenta lotes FEFO + Kardex auto.
 *   - lote.md: estados computados vigente|proximo_a_vencer (≤30d)|vencido.
 *   - cliente.md: telefono/direccion son privados (RNF-04) — no se exponen acá.
 */
class EmpleadoController extends Controller
{
    private const LIST_LIMIT = 8;
    private const VENCIMIENTO_THRESHOLD_DAYS = 30;
    private const PER_PAGE_DEFAULT = 25;

    /**
     * Dashboard agregado de la sucursal del empleado. Shape paralelo al admin para
     * que las cards presentacionales sean reutilizables sin adapter.
     */
    public function dashboard(Request $request)
    {
        $user = $request->user();
        abort_if($user->sucursal_id === null, 422, 'Usuario sin sucursal asignada');

        $hoy = Carbon::today();
        $en30 = $hoy->copy()->addDays(self::VENCIMIENTO_THRESHOLD_DAYS);
        $sucursalId = $user->sucursal_id;

        return [
            'kpis' => $this->kpis($sucursalId, $hoy, $en30),
            'stock_critico' => $this->stockCritico($sucursalId),
            'lotes_por_vencer' => $this->lotesPorVencer($sucursalId, $hoy, $en30),
            'ventas_recientes' => $this->ventasRecientes($sucursalId, $hoy),
            'pedidos_pendientes' => $this->pedidosPendientes($sucursalId),
        ];
    }

    /**
     * Vista paginada de medicamentos con stock agregado de la sucursal del empleado.
     * Solo lectura: el catálogo (precio, baja) lo edita el admin (RNF-03 / rbac.md).
     */
    public function inventarioMedicamentos(Request $request)
    {
        $user = $request->user();
        abort_if($user->sucursal_id === null, 422, 'Usuario sin sucursal asignada');

        $q = DB::table('medicamentos')
            ->leftJoin('lotes', function ($join) {
                $join->on('lotes.medicamento_id', '=', 'medicamentos.id')
                    ->whereRaw('lotes.cantidad_actual > 0');
            })
            ->join('categorias', 'categorias.id', '=', 'medicamentos.categoria_id')
            ->whereNull('medicamentos.deleted_at')
            ->where('medicamentos.activo', true)
            ->where('medicamentos.sucursal_id', $user->sucursal_id)
            ->groupBy([
                'medicamentos.id',
                'medicamentos.nombre_comercial',
                'medicamentos.principio_activo',
                'medicamentos.codigo_barras',
                'medicamentos.stock_minimo',
                'medicamentos.ubicacion_fisica',
                'medicamentos.requiere_receta',
                'medicamentos.precio',
                'categorias.id',
                'categorias.nombre',
            ])
            ->select([
                'medicamentos.id',
                'medicamentos.nombre_comercial',
                'medicamentos.principio_activo',
                'medicamentos.codigo_barras',
                'medicamentos.stock_minimo',
                'medicamentos.ubicacion_fisica',
                'medicamentos.requiere_receta',
                'medicamentos.precio',
                'categorias.id as categoria_id',
                'categorias.nombre as categoria_nombre',
                DB::raw('COALESCE(SUM(CASE WHEN lotes.fecha_vencimiento >= CURRENT_DATE THEN lotes.cantidad_actual ELSE 0 END), 0) AS stock_actual'),
                DB::raw('COUNT(CASE WHEN lotes.fecha_vencimiento >= CURRENT_DATE THEN 1 END) AS lotes_vigentes_count'),
                DB::raw("COUNT(CASE WHEN lotes.fecha_vencimiento BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '" . self::VENCIMIENTO_THRESHOLD_DAYS . " days') THEN 1 END) AS lotes_por_vencer_count"),
            ]);

        if ($request->filled('categoria_id')) {
            $q->where('medicamentos.categoria_id', $request->categoria_id);
        }
        if ($request->boolean('solo_critico')) {
            $q->havingRaw('COALESCE(SUM(CASE WHEN lotes.fecha_vencimiento >= CURRENT_DATE THEN lotes.cantidad_actual ELSE 0 END), 0) < medicamentos.stock_minimo');
        }
        if ($request->filled('q')) {
            $term = '%' . $request->q . '%';
            $q->where(function ($qq) use ($term) {
                $qq->where('medicamentos.nombre_comercial', 'ilike', $term)
                    ->orWhere('medicamentos.principio_activo', 'ilike', $term)
                    ->orWhere('medicamentos.codigo_barras', 'ilike', $term);
            });
        }

        return $q->orderBy('medicamentos.nombre_comercial')
            ->paginate($request->integer('per_page', self::PER_PAGE_DEFAULT));
    }

    /**
     * Lista paginada de clientes registrados (rol=cliente). Búsqueda libre por
     * nombre/email. NO devuelve telefono/direccion (RNF-04 / cliente.md).
     */
    public function clientes(Request $request)
    {
        $q = Usuario::clientes()
            ->select(['id', 'nombre', 'email', 'created_at'])
            ->withCount(['ventas as ventas_count', 'pedidos as pedidos_count'])
            ->orderBy('nombre');

        if ($request->filled('q')) {
            $term = '%' . $request->q . '%';
            $q->where(function ($qq) use ($term) {
                $qq->where('nombre', 'ilike', $term)
                    ->orWhere('email', 'ilike', $term);
            });
        }
        if ($request->boolean('activos', true) === false) {
            // dejamos que el frontend pida explícito si quiere inactivos
        } else {
            $q->where('activo', true);
        }

        return $q->paginate($request->integer('per_page', self::PER_PAGE_DEFAULT));
    }

    /**
     * Detalle de un cliente: identidad + ventas (de la sucursal del empleado) +
     * pedidos (sin filtro de sucursal, porque pedidos online cruzan cadena).
     */
    public function clienteDetalle(Request $request, int $id)
    {
        $user = $request->user();
        abort_if($user->sucursal_id === null, 422, 'Usuario sin sucursal asignada');

        $cliente = Usuario::clientes()
            ->select(['id', 'nombre', 'email', 'created_at'])
            ->findOrFail($id);

        $ventas = Venta::query()
            ->where('cliente_id', $cliente->id)
            ->where('sucursal_id', $user->sucursal_id)
            ->orderByDesc('fecha')
            ->limit(20)
            ->get(['id', 'numero_comprobante', 'fecha', 'total', 'estado', 'metodo_pago']);

        $pedidos = Pedido::query()
            ->where('cliente_id', $cliente->id)
            ->orderByDesc('fecha_solicitud')
            ->limit(20)
            ->get(['id', 'numero_pedido', 'fecha_solicitud', 'total', 'estado']);

        return [
            'cliente' => $cliente,
            'ventas' => $ventas,
            'pedidos' => $pedidos,
        ];
    }

    /* ============================ helpers privados ============================ */

    private function kpis(int $sucursalId, Carbon $hoy, Carbon $en30): array
    {
        $ventasDelDia = (float) Venta::query()
            ->where('sucursal_id', $sucursalId)
            ->whereDate('fecha', $hoy)
            ->where('estado', 'completada')
            ->sum('total');

        $ventasCountDia = Venta::query()
            ->where('sucursal_id', $sucursalId)
            ->whereDate('fecha', $hoy)
            ->where('estado', 'completada')
            ->count();

        $stockCriticoCount = $this->stockCriticoQuery($sucursalId)->count();

        $lotesPorVencerCount = Lote::query()
            ->where('sucursal_id', $sucursalId)
            ->whereBetween('fecha_vencimiento', [$hoy->toDateString(), $en30->toDateString()])
            ->where('cantidad_actual', '>', 0)
            ->count();

        $pedidosPendientesCount = Pedido::query()
            ->where('sucursal_id', $sucursalId)
            ->whereIn('estado', ['pendiente', 'en_camino'])
            ->count();

        return [
            'ventas_del_dia' => $ventasDelDia,
            'ventas_count_dia' => $ventasCountDia,
            'stock_critico_count' => $stockCriticoCount,
            'lotes_por_vencer_count' => $lotesPorVencerCount,
            'pedidos_pendientes_count' => $pedidosPendientesCount,
        ];
    }

    private function stockCritico(int $sucursalId): array
    {
        return $this->stockCriticoQuery($sucursalId)
            ->orderByRaw('(COALESCE(SUM(lotes.cantidad_actual), 0)::float / NULLIF(medicamentos.stock_minimo, 0)) ASC')
            ->limit(self::LIST_LIMIT)
            ->get()
            ->map(fn ($r) => [
                'id' => (string) $r->medicamento_id,
                'sucursal' => $r->sucursal_nombre,
                'medicamento' => $r->medicamento_nombre,
                'stock_actual' => (int) $r->stock_actual,
                'stock_minimo' => (int) $r->stock_minimo,
            ])
            ->all();
    }

    private function stockCriticoQuery(int $sucursalId): \Illuminate\Database\Query\Builder
    {
        return DB::table('medicamentos')
            ->leftJoin('lotes', function ($join) {
                $join->on('lotes.medicamento_id', '=', 'medicamentos.id')
                    ->whereRaw('lotes.fecha_vencimiento >= CURRENT_DATE');
            })
            ->join('sucursales', 'sucursales.id', '=', 'medicamentos.sucursal_id')
            ->whereNull('medicamentos.deleted_at')
            ->where('medicamentos.activo', true)
            ->where('medicamentos.stock_minimo', '>', 0)
            ->where('medicamentos.sucursal_id', $sucursalId)
            ->groupBy('medicamentos.id', 'medicamentos.nombre_comercial', 'medicamentos.stock_minimo', 'sucursales.nombre')
            ->havingRaw('COALESCE(SUM(lotes.cantidad_actual), 0) < medicamentos.stock_minimo')
            ->select([
                'medicamentos.id as medicamento_id',
                'medicamentos.nombre_comercial as medicamento_nombre',
                'medicamentos.stock_minimo',
                'sucursales.nombre as sucursal_nombre',
                DB::raw('COALESCE(SUM(lotes.cantidad_actual), 0) as stock_actual'),
            ]);
    }

    private function lotesPorVencer(int $sucursalId, Carbon $hoy, Carbon $en30): array
    {
        return Lote::query()
            ->with(['medicamento:id,nombre_comercial', 'sucursal:id,nombre'])
            ->where('sucursal_id', $sucursalId)
            ->whereBetween('fecha_vencimiento', [$hoy->toDateString(), $en30->toDateString()])
            ->where('cantidad_actual', '>', 0)
            ->orderBy('fecha_vencimiento')
            ->limit(self::LIST_LIMIT)
            ->get()
            ->map(fn (Lote $lote) => [
                'id' => (string) $lote->id,
                'codigo_lote' => $lote->numero_lote,
                'medicamento' => $lote->medicamento?->nombre_comercial ?? '—',
                'sucursal' => $lote->sucursal?->nombre ?? '—',
                'vencimiento' => $lote->fecha_vencimiento?->toDateString(),
                'dias_restantes' => $hoy->diffInDays(Carbon::parse($lote->fecha_vencimiento), false),
            ])
            ->all();
    }

    private function ventasRecientes(int $sucursalId, Carbon $hoy): array
    {
        return Venta::query()
            ->with('cliente:id,nombre')
            ->where('sucursal_id', $sucursalId)
            ->whereDate('fecha', $hoy)
            ->orderByDesc('fecha')
            ->limit(self::LIST_LIMIT)
            ->get()
            ->map(fn (Venta $v) => [
                'id' => (string) $v->id,
                'numero_comprobante' => $v->numero_comprobante,
                'cliente' => $v->cliente?->nombre ?? 'Consumidor final',
                'fecha' => $v->fecha?->toIso8601String(),
                'total' => (float) $v->total,
                'estado' => $v->estado,
                'metodo_pago' => $v->metodo_pago,
            ])
            ->all();
    }

    private function pedidosPendientes(int $sucursalId): array
    {
        return Pedido::query()
            ->with('cliente:id,nombre')
            ->where('sucursal_id', $sucursalId)
            ->whereIn('estado', ['pendiente', 'en_camino'])
            ->orderBy('fecha_solicitud')
            ->limit(self::LIST_LIMIT)
            ->get()
            ->map(fn (Pedido $p) => [
                'id' => (string) $p->id,
                'codigo' => $p->numero_pedido,
                'cliente' => $p->cliente?->nombre ?? '—',
                'fecha' => $p->fecha_solicitud?->toIso8601String(),
                'total' => (float) $p->total,
                'estado' => $p->estado,
            ])
            ->all();
    }
}
