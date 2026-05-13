<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lote;
use App\Models\Medicamento;
use App\Models\MovimientoStock;
use App\Models\Pedido;
use App\Models\Venta;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Dashboards agregados por rol. Cada método arma todas las secciones de su
 * pantalla en una sola respuesta — el frontend hace 1 round-trip.
 *
 * Scope:
 *   admin: agregado global (todas las sucursales). Ver Frontend/components/custom/admin/dashboard.
 *
 * Reglas tomadas del vault (no inventar):
 *   - venta.estado: completada|anulada (domain/venta.md)
 *   - pedido.estado: pendiente|en_camino|entregado|cancelado (domain/pedido.md)
 *   - lote.estado computado: vigente|proximo_a_vencer (<=30d)|vencido (domain/lote.md)
 *   - stock_minimo vive en medicamento (no lote): stock crítico = sum(lote.cantidad_actual) < medicamento.stock_minimo
 *   - movimientos_stock es Kardex inmutable → fuente de auditoría
 */
class DashboardController extends Controller
{
    /** Máximo de filas en cada lista del dashboard admin. */
    private const LIST_LIMIT = 8;
    /** Umbral en días para "lote próximo a vencer" — definido en domain/lote.md. */
    private const VENCIMIENTO_THRESHOLD_DAYS = 30;

    public function admin(Request $request)
    {
        $hoy = Carbon::today();
        $en30 = $hoy->copy()->addDays(self::VENCIMIENTO_THRESHOLD_DAYS);

        return [
            'kpis' => $this->kpis($hoy, $en30),
            'stock_critico' => $this->stockCritico(),
            'lotes_por_vencer' => $this->lotesPorVencer($hoy, $en30),
            'pedidos_pendientes' => $this->pedidosPendientes(),
            'auditoria_reciente' => $this->auditoriaReciente(),
        ];
    }

    private function kpis(Carbon $hoy, Carbon $en30): array
    {
        $ventasDelDia = (float) Venta::query()
            ->whereDate('fecha', $hoy)
            ->where('estado', 'completada')
            ->sum('total');

        $stockCriticoCount = $this->stockCriticoQuery()->count();

        $lotesPorVencerCount = Lote::query()
            ->whereBetween('fecha_vencimiento', [$hoy->toDateString(), $en30->toDateString()])
            ->where('cantidad_actual', '>', 0)
            ->count();

        $pedidosPendientesCount = Pedido::query()
            ->whereIn('estado', ['pendiente', 'en_camino'])
            ->count();

        return [
            'ventas_del_dia' => $ventasDelDia,
            'stock_critico_count' => $stockCriticoCount,
            'lotes_por_vencer_count' => $lotesPorVencerCount,
            'pedidos_pendientes_count' => $pedidosPendientesCount,
        ];
    }

    /**
     * Medicamentos cuya suma de cantidad_actual entre todos sus lotes vigentes
     * está por debajo de stock_minimo. Granularidad: medicamento × sucursal.
     */
    private function stockCritico(): array
    {
        // En Postgres no se puede referenciar un alias del SELECT dentro de CAST()
        // en ORDER BY (el planner intenta resolverlo como columna real). Repetimos
        // la expresión completa con cast nativo `::float`.
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

    /**
     * Query base reutilizada por count y listado, para que el conteo coincida con la lista.
     * Agrega por medicamento; cada medicamento tiene su propia sucursal (domain/medicamento.md).
     */
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

    private function lotesPorVencer(Carbon $hoy, Carbon $en30): array
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

    private function pedidosPendientes(): array
    {
        return Pedido::query()
            ->with('cliente:id,nombre')
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

    /**
     * Últimos N movimientos del Kardex como log de auditoría. El "actor" es el usuario
     * que ejecutó la operación (nullable si fue automático), la "acción" se deriva del
     * tipo del movimiento y la "entidad" del lote afectado.
     */
    private function auditoriaReciente(): array
    {
        $acciones = [
            'ingreso' => 'registró ingreso de',
            'venta' => 'descontó stock por venta de',
            'devolucion_cliente' => 'restituyó stock por devolución de',
            'devolucion_proveedor' => 'devolvió al proveedor',
            'ajuste' => 'ajustó stock de',
            'vencimiento' => 'dio de baja por vencimiento',
            'perdida' => 'registró pérdida de',
        ];

        return MovimientoStock::query()
            ->with(['usuario:id,nombre', 'lote:id,numero_lote,medicamento_id', 'lote.medicamento:id,nombre_comercial'])
            ->orderByDesc('created_at')
            ->limit(self::LIST_LIMIT)
            ->get()
            ->map(function (MovimientoStock $m) use ($acciones) {
                $med = $m->lote?->medicamento?->nombre_comercial ?? 'medicamento';
                $loteLabel = $m->lote ? "Lote {$m->lote->numero_lote} · {$med}" : "Lote eliminado";
                return [
                    'id' => (string) $m->id,
                    'actor' => $m->usuario?->nombre ?? 'Sistema',
                    'accion' => $acciones[$m->tipo] ?? $m->tipo,
                    'entidad' => $loteLabel,
                    'fecha' => $m->created_at?->toIso8601String(),
                ];
            })
            ->all();
    }
}
