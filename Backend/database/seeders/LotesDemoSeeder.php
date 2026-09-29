<?php

namespace Database\Seeders;

use App\Models\Medicamento;
use App\Models\Sucursal;
use App\Models\Usuario;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Stock de demostración: 1 lote por medicamento + su movimiento 'ingreso' en el
 * Kardex (mismo contrato que LoteController@store: cantidad_actual == suma de
 * movimientos). Incluye lotes próximos a vencer y vencidos a propósito.
 *
 * NO forma parte de DatabaseSeeder (que corre en cada deploy). Ejecutar a mano:
 *   php artisan db:seed --class=LotesDemoSeeder
 *
 * Idempotente: omite los medicamentos que ya tienen lotes.
 */
class LotesDemoSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $guano = Sucursal::firstWhere('nombre', 'Sucursal Guano');
        $admin = Usuario::firstWhere('email', 'admin@farmedic.local');
        $now   = now()->toDateTimeString();

        foreach (CatalogoSeeder::catalogo() as $row) {
            [$nombre, , , , , , , $provKey, $loteNum, $loteVenc, $loteCant, $loteCosto, $enGuano] = $row;

            $meds = Medicamento::with('proveedor')
                ->where('nombre_comercial', $nombre)
                ->get();

            foreach ($meds as $med) {
                if ($med->lotes()->exists()) {
                    continue;
                }

                $esGuano = $guano && $med->sucursal_id === $guano->id;
                $numero  = $esGuano ? str_replace('FM-', 'FG-', $loteNum) : $loteNum;

                DB::transaction(function () use ($med, $numero, $loteVenc, $loteCant, $loteCosto, $admin, $now) {
                    $loteId = DB::table('lotes')->insertGetId([
                        'medicamento_id'    => $med->id,
                        'sucursal_id'       => $med->sucursal_id,
                        'proveedor_id'      => $med->proveedor_id,
                        'numero_lote'       => $numero,
                        'fecha_vencimiento' => $loteVenc,
                        'fecha_ingreso'     => now()->subMonths(2)->toDateString(),
                        'cantidad_inicial'  => $loteCant,
                        'cantidad_actual'   => $loteCant,
                        'costo_unitario'    => $loteCosto,
                        'created_at'        => $now,
                        'updated_at'        => $now,
                    ]);

                    DB::table('movimientos_stock')->insert([
                        'lote_id'         => $loteId,
                        'sucursal_id'     => $med->sucursal_id,
                        'usuario_id'      => $admin?->id,
                        'tipo'            => 'ingreso',
                        'cantidad'        => $loteCant,
                        'referencia_tipo' => 'Proveedor',
                        'referencia_id'   => $med->proveedor_id,
                        'justificacion'   => "Ingreso lote {$numero} (carga inicial demo)",
                        'created_at'      => $now,
                    ]);
                });
            }
        }
    }
}
