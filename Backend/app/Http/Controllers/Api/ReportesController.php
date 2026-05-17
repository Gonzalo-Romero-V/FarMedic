<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Farmacia;
use App\Models\MovimientoStock;
use App\Models\Sucursal;
use App\Models\Venta;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Reportes mensuales agregados para el admin (RNF-03 — solo admin puede generarlos).
 *
 * Métricas (según vault y decisión del sprint):
 *   - Ventas: totalizado + por sucursal + desglose por método_pago. Solo estado=completada.
 *   - Stock crítico: snapshot al cierre del mes (último día). Medicamentos con
 *     SUM(lote.cantidad_actual vigentes) < medicamento.stock_minimo.
 *   - Kardex: conteo por tipo (7 tipos canónicos de [[movimiento-stock]]) totalizado y por sucursal.
 *
 * Pedidos NO se incluyen (decisión del sprint para mantener el reporte ajustado a
 * operación de mostrador + inventario; admin tiene `/admin/dashboard` para ver pedidos).
 */
class ReportesController extends Controller
{
    /** JSON preview — alimenta el frontend antes de descargar el PDF. */
    public function mensual(Request $request)
    {
        $validated = $request->validate([
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'month' => ['required', 'integer', 'between:1,12'],
        ]);

        return $this->armarReporte((int) $validated['year'], (int) $validated['month']);
    }

    /** Mismo dataset que mensual() pero renderizado a PDF con Blade + dompdf. */
    public function mensualPdf(Request $request)
    {
        $validated = $request->validate([
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'month' => ['required', 'integer', 'between:1,12'],
        ]);

        $data = $this->armarReporte((int) $validated['year'], (int) $validated['month']);
        $pdf = Pdf::loadView('reportes.mensual', $data)->setPaper('a4', 'portrait');

        $filename = sprintf('reporte-%04d-%02d.pdf', $validated['year'], $validated['month']);
        return $pdf->download($filename);
    }

    /** Arma el dataset completo. Comparte estructura entre JSON preview y PDF. */
    private function armarReporte(int $year, int $month): array
    {
        $inicio = Carbon::create($year, $month, 1)->startOfMonth();
        $fin = (clone $inicio)->endOfMonth();
        $farmacia = Farmacia::first();
        $sucursales = Sucursal::orderBy('nombre')->get(['id', 'nombre', 'ciudad']);

        return [
            'periodo' => [
                'year' => $year,
                'month' => $month,
                'mes_label' => $inicio->locale('es')->isoFormat('MMMM YYYY'),
                'desde' => $inicio->toDateString(),
                'hasta' => $fin->toDateString(),
            ],
            'farmacia' => $farmacia,
            'generado_en' => now()->toIso8601String(),
            'sucursales' => $sucursales,
            'ventas' => $this->seccionVentas($inicio, $fin),
            'stock_critico' => $this->seccionStockCritico($fin),
            'kardex' => $this->seccionKardex($inicio, $fin),
        ];
    }

    /**
     * Sección Ventas: totalizado mensual + breakdown por sucursal y por método.
     * Solo cuenta `estado=completada` (anuladas se excluyen del reporte de ingresos).
     */
    private function seccionVentas(Carbon $inicio, Carbon $fin): array
    {
        $base = Venta::query()
            ->whereBetween('fecha', [$inicio, $fin])
            ->where('estado', 'completada');

        $totalizado = (clone $base)
            ->selectRaw('COUNT(*) AS cantidad')
            ->selectRaw('COALESCE(SUM(subtotal), 0) AS subtotal')
            ->selectRaw('COALESCE(SUM(impuesto_total), 0) AS impuesto_total')
            ->selectRaw('COALESCE(SUM(total), 0) AS total')
            ->first();

        $porSucursal = (clone $base)
            ->join('sucursales', 'sucursales.id', '=', 'ventas.sucursal_id')
            ->groupBy('sucursales.id', 'sucursales.nombre', 'sucursales.ciudad')
            ->selectRaw('sucursales.id AS sucursal_id, sucursales.nombre, sucursales.ciudad, '
                . 'COUNT(*) AS cantidad, '
                . 'COALESCE(SUM(ventas.subtotal), 0) AS subtotal, '
                . 'COALESCE(SUM(ventas.impuesto_total), 0) AS impuesto_total, '
                . 'COALESCE(SUM(ventas.total), 0) AS total')
            ->orderBy('sucursales.nombre')
            ->get();

        $porMetodo = (clone $base)
            ->groupBy('metodo_pago')
            ->selectRaw('metodo_pago, COUNT(*) AS cantidad, COALESCE(SUM(total), 0) AS total')
            ->orderBy('metodo_pago')
            ->get();

        return [
            'totalizado' => $totalizado,
            'por_sucursal' => $porSucursal,
            'por_metodo' => $porMetodo,
        ];
    }

    /**
     * Stock crítico al ÚLTIMO día del mes. Snapshot de hoy (no es histórico real
     * porque no guardamos series temporales de stock — limitación documentada).
     * Para meses pasados, el resultado puede no reflejar el estado real al día 'hasta'.
     */
    private function seccionStockCritico(Carbon $fin): array
    {
        // Sólo aplicamos el snapshot cuando `fin` no es futuro.
        if ($fin->isFuture()) {
            return [];
        }

        $rows = DB::table('medicamentos')
            ->leftJoin('lotes', function ($join) {
                $join->on('lotes.medicamento_id', '=', 'medicamentos.id')
                    ->whereRaw('lotes.fecha_vencimiento >= CURRENT_DATE');
            })
            ->join('sucursales', 'sucursales.id', '=', 'medicamentos.sucursal_id')
            ->whereNull('medicamentos.deleted_at')
            ->where('medicamentos.activo', true)
            ->where('medicamentos.stock_minimo', '>', 0)
            ->groupBy('sucursales.id', 'sucursales.nombre', 'medicamentos.id', 'medicamentos.nombre_comercial', 'medicamentos.stock_minimo')
            ->havingRaw('COALESCE(SUM(lotes.cantidad_actual), 0) < medicamentos.stock_minimo')
            ->select([
                'sucursales.id AS sucursal_id',
                'sucursales.nombre AS sucursal_nombre',
                'medicamentos.id AS medicamento_id',
                'medicamentos.nombre_comercial AS medicamento_nombre',
                'medicamentos.stock_minimo',
                DB::raw('COALESCE(SUM(lotes.cantidad_actual), 0) AS stock_actual'),
            ])
            ->orderBy('sucursales.nombre')
            ->orderBy('medicamentos.nombre_comercial')
            ->get();

        return $rows->groupBy('sucursal_nombre')->map(fn ($items, $nombre) => [
            'sucursal' => $nombre,
            'items' => $items->values(),
        ])->values()->all();
    }

    /**
     * Kardex resumen: conteo de movimientos por tipo (7 tipos canónicos) y por sucursal.
     * Útil para auditar la actividad de stock del mes.
     */
    private function seccionKardex(Carbon $inicio, Carbon $fin): array
    {
        $totalizado = MovimientoStock::query()
            ->whereBetween('created_at', [$inicio, $fin])
            ->groupBy('tipo')
            ->selectRaw('tipo, COUNT(*) AS cantidad, COALESCE(SUM(ABS(cantidad)), 0) AS unidades')
            ->orderBy('tipo')
            ->get();

        $porSucursal = MovimientoStock::query()
            ->whereBetween('movimientos_stock.created_at', [$inicio, $fin])
            ->join('sucursales', 'sucursales.id', '=', 'movimientos_stock.sucursal_id')
            ->groupBy('sucursales.id', 'sucursales.nombre', 'movimientos_stock.tipo')
            ->selectRaw('sucursales.id AS sucursal_id, sucursales.nombre AS sucursal_nombre, '
                . 'movimientos_stock.tipo, COUNT(*) AS cantidad, COALESCE(SUM(ABS(movimientos_stock.cantidad)), 0) AS unidades')
            ->orderBy('sucursales.nombre')
            ->orderBy('movimientos_stock.tipo')
            ->get();

        return [
            'totalizado' => $totalizado,
            'por_sucursal' => $porSucursal->groupBy('sucursal_nombre')->map(fn ($items, $nombre) => [
                'sucursal' => $nombre,
                'tipos' => $items->values(),
            ])->values()->all(),
        ];
    }
}
