<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lote;
use App\Models\Medicamento;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Dashboards y agregados del módulo Inventario (admin).
 *
 * Scope: global (admin ve todas las sucursales — multi-tenancy regla vault).
 *
 * Reglas tomadas del vault (no inventar):
 *   - lote.estado computado: vigente | proximo_a_vencer (≤30d) | vencido (domain/lote.md)
 *   - stock crítico: SUM(lote.cantidad_actual vigentes) < medicamento.stock_minimo (domain/medicamento.md)
 *   - lote vencido no cuenta como stock disponible pero persiste (decisión iteración 1)
 *   - costo_unitario por lote, valor inventario = SUM(cantidad_actual × costo_unitario) sobre lotes vigentes
 */
class InventarioController extends Controller
{
    /** Máximo de filas en cada lista de overview. */
    private const LIST_LIMIT = 8;
    /** Umbral en días para "próximo a vencer" — domain/lote.md. */
    private const VENCIMIENTO_THRESHOLD_DAYS = 30;
    /** Paginado por defecto del listado de medicamentos. */
    private const MEDICAMENTOS_PER_PAGE_DEFAULT = 25;

    /**
     * Overview agregado: KPIs + listas cortas de stock crítico y lotes por vencer.
     * Shape alineado con DashboardController@admin para que los componentes
     * presentacionales del frontend (StockCriticoCard, LotesPorVencerCard) sean
     * reutilizables sin adapter extra.
     */
    public function overview(Request $request)
    {
        $hoy = Carbon::today();
        $en30 = $hoy->copy()->addDays(self::VENCIMIENTO_THRESHOLD_DAYS);

        return [
            'kpis' => $this->kpis($hoy, $en30),
            'stock_critico' => $this->stockCriticoLista(),
            'lotes_por_vencer' => $this->lotesPorVencerLista($hoy, $en30),
        ];
    }

    private function kpis(Carbon $hoy, Carbon $en30): array
    {
        $totalMedicamentos = Medicamento::query()
            ->whereNull('deleted_at')
            ->where('activo', true)
            ->count();

        $totalLotesActivos = Lote::query()
            ->where('cantidad_actual', '>', 0)
            ->whereDate('fecha_vencimiento', '>=', $hoy->toDateString())
            ->count();

        $stockCriticoCount = $this->stockCriticoQuery()->count();

        $lotesPorVencerCount = Lote::query()
            ->whereBetween('fecha_vencimiento', [$hoy->toDateString(), $en30->toDateString()])
            ->where('cantidad_actual', '>', 0)
            ->count();

        $lotesVencidosCount = Lote::query()
            ->whereDate('fecha_vencimiento', '<', $hoy->toDateString())
            ->where('cantidad_actual', '>', 0)
            ->count();

        // KPI opcional: solo se incluye cuando hay datos confiables. Si todos los
        // costos son 0 el valor sería 0 también — devolvemos null para que el frontend
        // pueda decidir ocultarlo.
        $valorRaw = Lote::query()
            ->whereDate('fecha_vencimiento', '>=', $hoy->toDateString())
            ->where('cantidad_actual', '>', 0)
            ->selectRaw('COALESCE(SUM(cantidad_actual * costo_unitario), 0) AS valor')
            ->value('valor');
        $valorInventario = $valorRaw > 0 ? (float) $valorRaw : null;

        return [
            'total_medicamentos' => $totalMedicamentos,
            'total_lotes_activos' => $totalLotesActivos,
            'stock_critico_count' => $stockCriticoCount,
            'lotes_por_vencer_count' => $lotesPorVencerCount,
            'lotes_vencidos_count' => $lotesVencidosCount,
            'valor_inventario_usd' => $valorInventario,
        ];
    }

    /**
     * Vista paginada de medicamentos con su stock agregado entre lotes vigentes,
     * sus contadores de lotes (vigentes / por vencer / vencidos con stock) y flags.
     * Pensado para la página /admin/inventario/medicamentos.
     */
    public function medicamentos(Request $request)
    {
        $hoy = Carbon::today();
        $en30 = $hoy->copy()->addDays(self::VENCIMIENTO_THRESHOLD_DAYS);

        $q = DB::table('medicamentos')
            ->leftJoin('lotes', function ($join) {
                $join->on('lotes.medicamento_id', '=', 'medicamentos.id')
                    ->whereRaw('lotes.cantidad_actual > 0');
            })
            ->join('sucursales', 'sucursales.id', '=', 'medicamentos.sucursal_id')
            ->join('categorias', 'categorias.id', '=', 'medicamentos.categoria_id')
            ->whereNull('medicamentos.deleted_at')
            ->where('medicamentos.activo', true)
            ->groupBy([
                'medicamentos.id',
                'medicamentos.nombre_comercial',
                'medicamentos.principio_activo',
                'medicamentos.stock_minimo',
                'medicamentos.requiere_receta',
                'medicamentos.precio',
                'sucursales.id',
                'sucursales.nombre',
                'categorias.id',
                'categorias.nombre',
            ])
            ->select([
                'medicamentos.id',
                'medicamentos.nombre_comercial',
                'medicamentos.principio_activo',
                'medicamentos.stock_minimo',
                'medicamentos.requiere_receta',
                'medicamentos.precio',
                'sucursales.id as sucursal_id',
                'sucursales.nombre as sucursal_nombre',
                'categorias.id as categoria_id',
                'categorias.nombre as categoria_nombre',
                DB::raw('COALESCE(SUM(CASE WHEN lotes.fecha_vencimiento >= CURRENT_DATE THEN lotes.cantidad_actual ELSE 0 END), 0) AS stock_actual'),
                DB::raw('COUNT(CASE WHEN lotes.fecha_vencimiento >= CURRENT_DATE THEN 1 END) AS lotes_vigentes_count'),
                DB::raw("COUNT(CASE WHEN lotes.fecha_vencimiento BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '" . self::VENCIMIENTO_THRESHOLD_DAYS . " days') THEN 1 END) AS lotes_por_vencer_count"),
                DB::raw('COUNT(CASE WHEN lotes.fecha_vencimiento < CURRENT_DATE THEN 1 END) AS lotes_vencidos_count'),
            ]);

        if ($request->filled('sucursal_id')) {
            $q->where('medicamentos.sucursal_id', $request->sucursal_id);
        }
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

        $q->orderBy('medicamentos.nombre_comercial');

        return $q->paginate(
            $request->integer('per_page', self::MEDICAMENTOS_PER_PAGE_DEFAULT),
        );
    }

    /**
     * Top N de medicamentos con stock crítico (mismo cálculo que el dashboard,
     * para que el shape sea reutilizable y la lista de overview coincida con el KPI).
     */
    private function stockCriticoLista(): array
    {
        return $this->stockCriticoQuery()
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

    /** Query reutilizada por count y listado para que el KPI coincida con la tabla. */
    private function stockCriticoQuery(): \Illuminate\Database\Query\Builder
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

    private function lotesPorVencerLista(Carbon $hoy, Carbon $en30): array
    {
        return Lote::query()
            ->with(['medicamento:id,nombre_comercial', 'sucursal:id,nombre'])
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
}
