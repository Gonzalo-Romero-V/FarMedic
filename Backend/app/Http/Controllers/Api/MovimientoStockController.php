<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lote;
use App\Models\MovimientoStock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Kardex: append-only. Solo index + show + store + ajustar.
 * No update, no destroy — inmutable por contrato.
 *
 * Discriminación por rol vía split de ruta (mismo patrón que VentaController::anular):
 *   - `store()`           — movimientos OPERATIVOS: devolucion_cliente, devolucion_proveedor,
 *                           vencimiento, perdida. Permitido a admin+empleado.
 *   - `ajustar()`         — corrección ADMINISTRATIVA (tipo=ajuste con signo signed).
 *                           Solo admin (gated por `role:administrador` en routes/api.php).
 *
 * Los tipos auto-generados (`ingreso`, `venta`) los crean LoteController y VentaController.
 */
class MovimientoStockController extends Controller
{
    public function index(Request $request)
    {
        $q = MovimientoStock::with(['lote.medicamento', 'usuario']);
        if ($request->filled('lote_id')) {
            $q->where('lote_id', $request->lote_id);
        }
        if ($request->filled('sucursal_id')) {
            $q->where('sucursal_id', $request->sucursal_id);
        }
        if ($request->filled('tipo')) {
            $q->where('tipo', $request->tipo);
        }
        return $q->orderByDesc('created_at')->paginate($request->integer('per_page', 50));
    }

    public function show(MovimientoStock $movimientoStock)
    {
        return $movimientoStock->load(['lote.medicamento', 'usuario', 'referencia']);
    }

    /**
     * Movimientos operativos manuales del Kardex. NO incluye `ajuste` — esa operación
     * tiene su propio endpoint (`/movimientos-stock/ajuste`) restringido a admin por
     * routes/api.php. Venta, ingreso y devoluciones automáticas las generan otros
     * controllers (VentaController, LoteController, PedidoController).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'lote_id' => ['required', 'exists:lotes,id'],
            'usuario_id' => ['required', 'exists:usuarios,id'],
            'tipo' => ['required', 'in:devolucion_cliente,devolucion_proveedor,vencimiento,perdida'],
            'cantidad' => ['required', 'integer', 'not_in:0'],
            'justificacion' => ['required_if:tipo,perdida', 'nullable', 'string'],
        ]);

        return $this->crearMovimiento($validated);
    }

    /**
     * Ajuste administrativo del stock. Solo admin (enforcement por ruta).
     * Es una corrección con signo signed (positivo o negativo) y justificación
     * obligatoria por contrato del Kardex ([[movimiento-stock]] y [[rbac]] `stock.adjust`).
     */
    public function ajustar(Request $request)
    {
        $validated = $request->validate([
            'lote_id' => ['required', 'exists:lotes,id'],
            'usuario_id' => ['required', 'exists:usuarios,id'],
            'cantidad' => ['required', 'integer', 'not_in:0'],
            'justificacion' => ['required', 'string'],
        ]);

        return $this->crearMovimiento([
            ...$validated,
            'tipo' => 'ajuste',
        ]);
    }

    /**
     * Helper compartido por store/ajustar: transacción + lock + validación de stock
     * no negativo + creación del movimiento + actualización de cantidad_actual del lote.
     */
    private function crearMovimiento(array $data)
    {
        return DB::transaction(function () use ($data) {
            $lote = Lote::lockForUpdate()->findOrFail($data['lote_id']);

            $nuevaCantidad = $lote->cantidad_actual + $data['cantidad'];
            if ($nuevaCantidad < 0) {
                abort(422, "Stock insuficiente. Actual: {$lote->cantidad_actual}, ajuste: {$data['cantidad']}");
            }

            $mov = MovimientoStock::create([
                'lote_id' => $lote->id,
                'sucursal_id' => $lote->sucursal_id,
                'usuario_id' => $data['usuario_id'],
                'tipo' => $data['tipo'],
                'cantidad' => $data['cantidad'],
                'justificacion' => $data['justificacion'] ?? null,
            ]);

            $lote->cantidad_actual = $nuevaCantidad;
            $lote->save();

            return $mov->load('lote');
        });
    }
}
