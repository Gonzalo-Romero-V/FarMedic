<?php

namespace Database\Seeders;

use App\Models\Categoria;
use App\Models\Farmacia;
use App\Models\Medicamento;
use App\Models\Proveedor;
use App\Models\Sucursal;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CatalogoSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Formato de número de lote: {PREFIX}-{YYYYMM}-{NNN}
     *   PREFIX  = FM (Matriz Riobamba) | FG (Guano)
     *   YYYYMM  = año-mes de fabricación aproximado (vencimiento − 2 años)
     *   NNN     = secuencia de 3 dígitos, única dentro del prefijo
     *
     * Lotes de prueba incluidos deliberadamente:
     *   - "2026-09-30" → próximo a vencer en ~90 días (alerta amarilla)
     *   - "2026-08-31" → próximo a vencer en ~60 días (alerta amarilla)
     *   - "2026-04-30" → ya vencido (alerta roja, para probar kardex)
     */
    public function run(): void
    {
        $farmacia = Farmacia::firstWhere('ruc', '1791234567001');

        $matriz = Sucursal::firstWhere(['farmacia_id' => $farmacia->id, 'nombre' => 'Matriz']);

        $guano = Sucursal::firstOrCreate(
            ['farmacia_id' => $farmacia->id, 'nombre' => 'Sucursal Guano'],
            [
                'ciudad'    => 'Guano',
                'direccion' => 'Av. 20 de Diciembre y García Moreno',
                'telefono'  => '+593 32 900 100',
                'latitud'   => -1.6093,
                'longitud'  => -78.6383,
                'activa'    => true,
            ]
        );

        // ── Categorías ──────────────────────────────────────────────────────
        $cats = [];
        foreach ([
            ['Analgésicos y Antipiréticos', 'Medicamentos para el dolor y la fiebre'],
            ['Antibióticos',                'Agentes antibacterianos de uso sistémico'],
            ['Antiinflamatorios',           'AINEs y corticosteroides'],
            ['Vitaminas y Suplementos',     'Micronutrientes, vitaminas y minerales'],
            ['Gastrointestinal',            'Antiácidos, antieméticos y reguladores intestinales'],
            ['Respiratorio y Alergias',     'Broncodilatadores, mucolíticos y antihistamínicos'],
            ['Cardiovascular',              'Antihipertensivos, hipolipemiantes y diuréticos'],
            ['Dermatología',                'Cremas, antifúngicos y corticosteroides tópicos'],
        ] as [$nombre, $desc]) {
            $cats[$nombre] = Categoria::firstOrCreate(['nombre' => $nombre], ['descripcion' => $desc]);
        }

        // ── Proveedores ──────────────────────────────────────────────────────
        $provs = [];
        foreach ([
            ['Difare S.A.',          '1790016919001', '+593 2 299 0000', 'ventas@difare.com.ec',    'Km 5.5 Vía a Daule, Guayaquil'],
            ['DYVENPRO Cía. Ltda.', '1790012345001', '+593 2 246 0000', 'pedidos@dyvenpro.com.ec', 'Av. Maldonado N°1200, Quito'],
            ['Leterago del Ecuador', '1790098765001', '+593 2 240 0000', 'contacto@leterago.com.ec','Panamericana Norte Km 3, Quito'],
        ] as [$nombre, $ruc, $tel, $email, $dir]) {
            $provs[$nombre] = Proveedor::firstOrCreate(['nombre' => $nombre], [
                'ruc'       => $ruc,
                'telefono'  => $tel,
                'email'     => $email,
                'direccion' => $dir,
                'activo'    => true,
            ]);
        }

        // ── Catálogo ─────────────────────────────────────────────────────────
        // Columnas:
        // [nombre_comercial, principio_activo, precio, stock_min, ubicacion, receta,
        //  categoria, proveedor, lote_num, lote_venc, lote_qty, lote_costo, en_guano]
        //
        // en_guano = true → el medicamento también se carga en Sucursal Guano
        // Lote Guano: mismo número pero prefijo FG en lugar de FM

        $catalogo = [
            // ── ANALGÉSICOS Y ANTIPIRÉTICOS ──────────────────────────────────
            ['Paracetamol 500 mg tab x10',        'Acetaminofén',                   0.35, 50, 'A1', false, 'Analgésicos y Antipiréticos', 'Difare S.A.',          'FM-202501-001', '2027-01-31', 500, 0.18, true],
            ['Paracetamol 1 g tab x10',            'Acetaminofén',                   0.55, 30, 'A1', false, 'Analgésicos y Antipiréticos', 'Difare S.A.',          'FM-202501-002', '2027-03-31', 300, 0.28, true],
            ['Paracetamol Jarabe 120 mg/5 ml',     'Acetaminofén',                   3.50, 20, 'A2', false, 'Analgésicos y Antipiréticos', 'Difare S.A.',          'FM-202503-003', '2027-06-30', 120, 1.80, true],
            ['Ibuprofeno 400 mg tab x10',           'Ibuprofeno',                     0.40, 50, 'A2', false, 'Analgésicos y Antipiréticos', 'DYVENPRO Cía. Ltda.', 'FM-202502-004', '2027-02-28', 400, 0.20, true],
            ['Ibuprofeno 600 mg tab x10',           'Ibuprofeno',                     0.60, 30, 'A2', false, 'Analgésicos y Antipiréticos', 'DYVENPRO Cía. Ltda.', 'FM-202502-005', '2027-04-30', 200, 0.30, true],
            ['Aspirina 100 mg tab x10',             'Ácido acetilsalicílico',         0.25, 40, 'A3', false, 'Analgésicos y Antipiréticos', 'Leterago del Ecuador', 'FM-202501-006', '2026-09-30', 100, 0.12, false], // próximo a vencer
            ['Dipirona 500 mg tab x10',             'Metamizol sódico',               0.30, 40, 'A3', false, 'Analgésicos y Antipiréticos', 'Difare S.A.',          'FM-202504-007', '2027-08-31', 300, 0.15, false],
            ['Tramadol 50 mg cáp x10',              'Tramadol HCl',                   1.20,  5, 'A4',  true, 'Analgésicos y Antipiréticos', 'DYVENPRO Cía. Ltda.', 'FM-202501-008', '2027-01-31',  50, 0.60, false],
            ['Ketorolaco 10 mg tab x10',            'Ketorolaco trometamina',          0.80, 10, 'A4',  true, 'Analgésicos y Antipiréticos', 'Leterago del Ecuador', 'FM-202502-009', '2027-05-31',  80, 0.40, false],
            ['Codeína 30 mg tab x10',               'Fosfato de codeína',              1.50,  5, 'A5',  true, 'Analgésicos y Antipiréticos', 'DYVENPRO Cía. Ltda.', 'FM-202412-010', '2026-12-31',  20, 0.75, false],

            // ── ANTIBIÓTICOS ─────────────────────────────────────────────────
            ['Amoxicilina 500 mg cáp x12',         'Amoxicilina',                    0.45, 30, 'B1',  true, 'Antibióticos', 'Difare S.A.',          'FM-202503-011', '2027-03-31', 240, 0.22, true],
            ['Amoxicilina/Clavulánico 875/125 mg',  'Amoxicilina + Ácido clavulánico',1.80, 20, 'B1',  true, 'Antibióticos', 'Difare S.A.',          'FM-202504-012', '2027-04-30', 120, 0.90, true],
            ['Azitromicina 500 mg tab x3',          'Azitromicina',                   0.90, 20, 'B2',  true, 'Antibióticos', 'DYVENPRO Cía. Ltda.', 'FM-202502-013', '2027-02-28', 180, 0.45, true],
            ['Ciprofloxacino 500 mg tab x10',       'Ciprofloxacino HCl',             0.75, 20, 'B2',  true, 'Antibióticos', 'Leterago del Ecuador', 'FM-202503-014', '2027-06-30', 150, 0.38, true],
            ['Claritromicina 500 mg tab x10',       'Claritromicina',                 1.20, 15, 'B2',  true, 'Antibióticos', 'DYVENPRO Cía. Ltda.', 'FM-202504-015', '2027-07-31', 100, 0.60, true],
            ['Metronidazol 500 mg tab x10',         'Metronidazol',                   0.35, 30, 'B3',  true, 'Antibióticos', 'Difare S.A.',          'FM-202501-016', '2027-01-31', 300, 0.18, false],
            ['Cefalexina 500 mg cáp x12',           'Cefalexina monohidrato',         0.60, 20, 'B3',  true, 'Antibióticos', 'Leterago del Ecuador', 'FM-202502-017', '2027-02-28', 180, 0.30, false],
            ['Doxiciclina 100 mg cáp x10',          'Doxiciclina HCl',                0.55, 15, 'B4',  true, 'Antibióticos', 'DYVENPRO Cía. Ltda.', 'FM-202503-018', '2026-08-31',  60, 0.28, false], // próximo a vencer
            ['TMP/SMX 160/800 mg tab x10',          'Trimetoprim/Sulfametoxazol',     0.30, 25, 'B4',  true, 'Antibióticos', 'Difare S.A.',          'FM-202501-019', '2027-04-30', 200, 0.15, false],
            ['Nitrofurantoína 100 mg tab x10',      'Nitrofurantoína macrocristales',  0.65, 15, 'B5',  true, 'Antibióticos', 'Leterago del Ecuador', 'FM-202412-020', '2026-04-30',  40, 0.32, false], // VENCIDO

            // ── ANTIINFLAMATORIOS ─────────────────────────────────────────────
            ['Diclofenaco 50 mg tab x10',           'Diclofenaco sódico',             0.40, 40, 'C1', false, 'Antiinflamatorios', 'Difare S.A.',          'FM-202502-021', '2027-02-28', 300, 0.20, true],
            ['Diclofenaco 75 mg/3 ml amp x1',      'Diclofenaco sódico',             1.50, 10, 'C1',  true, 'Antiinflamatorios', 'DYVENPRO Cía. Ltda.', 'FM-202503-022', '2027-03-31',  60, 0.75, true],
            ['Naproxeno 500 mg tab x10',            'Naproxeno sódico',               0.45, 30, 'C2', false, 'Antiinflamatorios', 'Leterago del Ecuador', 'FM-202502-023', '2027-05-31', 200, 0.22, true],
            ['Meloxicam 15 mg tab x10',             'Meloxicam',                      0.70, 20, 'C2',  true, 'Antiinflamatorios', 'Difare S.A.',          'FM-202504-024', '2027-07-31', 150, 0.35, false],
            ['Piroxicam 20 mg cáp x10',             'Piroxicam',                      0.35, 20, 'C3', false, 'Antiinflamatorios', 'DYVENPRO Cía. Ltda.', 'FM-202501-025', '2027-01-31', 100, 0.18, false],
            ['Prednisona 5 mg tab x10',             'Prednisona',                     0.25, 25, 'C3',  true, 'Antiinflamatorios', 'Leterago del Ecuador', 'FM-202502-026', '2027-03-31', 250, 0.13, false],
            ['Prednisona 20 mg tab x10',            'Prednisona',                     0.45, 15, 'C4',  true, 'Antiinflamatorios', 'Difare S.A.',          'FM-202503-027', '2027-06-30', 120, 0.23, false],
            ['Betametasona 4 mg/1 ml amp x1',      'Betametasona fosfato sódico',    2.50, 10, 'C4',  true, 'Antiinflamatorios', 'DYVENPRO Cía. Ltda.', 'FM-202504-028', '2027-04-30',  50, 1.25, false],

            // ── VITAMINAS Y SUPLEMENTOS ───────────────────────────────────────
            ['Vitamina C 1000 mg efervescente x10', 'Ácido ascórbico',               0.60, 30, 'D1', false, 'Vitaminas y Suplementos', 'Difare S.A.',          'FM-202502-029', '2028-02-28', 200, 0.30, true],
            ['Vitamina D3 2000 UI cáp x30',         'Colecalciferol',                 0.55, 20, 'D1', false, 'Vitaminas y Suplementos', 'DYVENPRO Cía. Ltda.', 'FM-202503-030', '2028-03-31', 150, 0.28, true],
            ['Complejo B tab x20',                  'Vitaminas del complejo B',       0.30, 30, 'D2', false, 'Vitaminas y Suplementos', 'Leterago del Ecuador', 'FM-202501-031', '2027-12-31', 300, 0.15, true],
            ['Calcio + Vitamina D tab x30',         'Carbonato de calcio + Colecalciferol',0.65,20,'D2',false,'Vitaminas y Suplementos','Difare S.A.',        'FM-202504-032', '2028-04-30', 120, 0.33, true],
            ['Sulfato Ferroso 300 mg tab x20',      'Sulfato ferroso',                0.20, 30, 'D3',  true, 'Vitaminas y Suplementos', 'DYVENPRO Cía. Ltda.', 'FM-202502-033', '2027-08-31', 250, 0.10, true],
            ['Ácido Fólico 5 mg tab x20',           'Ácido fólico',                   0.15, 30, 'D3',  true, 'Vitaminas y Suplementos', 'Leterago del Ecuador', 'FM-202501-034', '2027-06-30', 400, 0.08, false],
            ['Vitamina E 400 UI cáp x20',           'Tocoferol',                      0.45, 20, 'D4', false, 'Vitaminas y Suplementos', 'Difare S.A.',          'FM-202503-035', '2028-01-31', 150, 0.23, false],
            ['Zinc 50 mg tab x20',                  'Zinc elemental',                 0.35, 20, 'D4', false, 'Vitaminas y Suplementos', 'DYVENPRO Cía. Ltda.', 'FM-202502-036', '2027-10-31', 200, 0.18, false],
            ['Omega-3 1000 mg cáp x30',             'Ácidos grasos omega-3',          0.75, 15, 'D5', false, 'Vitaminas y Suplementos', 'Leterago del Ecuador', 'FM-202504-037', '2028-04-30', 100, 0.38, false],
            ['Magnesio 400 mg tab x30',             'Óxido de magnesio',              0.50, 15, 'D5', false, 'Vitaminas y Suplementos', 'Difare S.A.',          'FM-202503-038', '2028-03-31', 120, 0.25, false],

            // ── GASTROINTESTINAL ──────────────────────────────────────────────
            ['Omeprazol 20 mg cáp x14',             'Omeprazol',                      0.35, 30, 'E1', false, 'Gastrointestinal', 'Difare S.A.',          'FM-202502-039', '2027-02-28', 350, 0.18, true],
            ['Omeprazol 40 mg cáp x14',             'Omeprazol',                      0.55, 20, 'E1',  true, 'Gastrointestinal', 'Difare S.A.',          'FM-202503-040', '2027-05-31', 200, 0.28, true],
            ['Ranitidina 150 mg tab x10',           'Ranitidina HCl',                 0.25, 30, 'E2', false, 'Gastrointestinal', 'DYVENPRO Cía. Ltda.', 'FM-202501-041', '2027-01-31', 300, 0.13, true],
            ['Metoclopramida 10 mg tab x10',        'Metoclopramida HCl',             0.30, 20, 'E2',  true, 'Gastrointestinal', 'Leterago del Ecuador', 'FM-202502-042', '2027-04-30', 150, 0.15, false],
            ['Domperidona 10 mg tab x10',           'Domperidona',                    0.40, 20, 'E3', false, 'Gastrointestinal', 'Difare S.A.',          'FM-202503-043', '2027-06-30', 200, 0.20, false],
            ['Loperamida 2 mg cáp x6',              'Loperamida HCl',                 0.50, 20, 'E3', false, 'Gastrointestinal', 'DYVENPRO Cía. Ltda.', 'FM-202502-044', '2027-03-31', 180, 0.25, false],
            ['Metronidazol Susp 250 mg/5 ml',       'Metronidazol',                   4.50, 10, 'E4',  true, 'Gastrointestinal', 'Leterago del Ecuador', 'FM-202504-045', '2027-07-31',  60, 2.25, false],
            ['Sales de Rehidratación Oral x10',     'Cloruro de sodio + KCl + glucosa',0.80,30, 'E4', false, 'Gastrointestinal', 'Difare S.A.',          'FM-202501-046', '2028-01-31', 200, 0.40, false],
            ['Bisacodil 5 mg tab x10',              'Bisacodilo',                     0.20, 20, 'E5', false, 'Gastrointestinal', 'DYVENPRO Cía. Ltda.', 'FM-202502-047', '2027-05-31', 200, 0.10, false],
            ['Simeticona 80 mg tab x20',            'Simeticona',                     0.35, 20, 'E5', false, 'Gastrointestinal', 'Leterago del Ecuador', 'FM-202503-048', '2027-08-31', 200, 0.18, false],

            // ── RESPIRATORIO Y ALERGIAS ───────────────────────────────────────
            ['Loratadina 10 mg tab x10',            'Loratadina',                     0.30, 30, 'F1', false, 'Respiratorio y Alergias', 'Difare S.A.',          'FM-202502-049', '2027-02-28', 300, 0.15, true],
            ['Cetirizina 10 mg tab x10',            'Cetirizina HCl',                 0.35, 30, 'F1', false, 'Respiratorio y Alergias', 'DYVENPRO Cía. Ltda.', 'FM-202503-050', '2027-05-31', 250, 0.18, true],
            ['Salbutamol Inhalador 100 mcg/dosis',  'Salbutamol sulfato',              8.50, 10, 'F2',  true, 'Respiratorio y Alergias', 'Leterago del Ecuador', 'FM-202504-051', '2027-04-30',  40, 4.25, true],
            ['Budesonida/Formoterol Inhalador',     'Budesonida + Formoterol',        28.00,  5, 'F2',  true, 'Respiratorio y Alergias', 'Difare S.A.',          'FM-202503-052', '2027-03-31',  20,14.00, false],
            ['Bromhexina 8 mg tab x20',             'Bromhexina HCl',                 0.30, 20, 'F3', false, 'Respiratorio y Alergias', 'DYVENPRO Cía. Ltda.', 'FM-202501-053', '2027-01-31', 200, 0.15, true],
            ['Ambroxol 30 mg tab x20',              'Ambroxol HCl',                   0.35, 20, 'F3', false, 'Respiratorio y Alergias', 'Leterago del Ecuador', 'FM-202502-054', '2027-04-30', 200, 0.18, false],
            ['N-Acetilcisteína 600 mg efervescente','N-Acetilcisteína',                0.90, 15, 'F4', false, 'Respiratorio y Alergias', 'Difare S.A.',          'FM-202503-055', '2027-06-30', 100, 0.45, false],
            ['Desloratadina 5 mg tab x10',          'Desloratadina',                   0.55, 20, 'F4', false, 'Respiratorio y Alergias', 'DYVENPRO Cía. Ltda.', 'FM-202504-056', '2027-07-31', 150, 0.28, false],
            ['Montelukast 10 mg tab x10',           'Montelukast sódico',              0.90, 15, 'F5',  true, 'Respiratorio y Alergias', 'Leterago del Ecuador', 'FM-202503-057', '2027-05-31', 100, 0.45, false],
            ['Ipratropio 20 mcg/dosis Inhalador',   'Bromuro de ipratropio',           7.50,  5, 'F5',  true, 'Respiratorio y Alergias', 'Difare S.A.',          'FM-202504-058', '2027-04-30',  25, 3.75, false],

            // ── CARDIOVASCULAR ────────────────────────────────────────────────
            ['Metoprolol 50 mg tab x20',            'Metoprolol tartrato',             0.45, 20, 'G1',  true, 'Cardiovascular', 'DYVENPRO Cía. Ltda.', 'FM-202502-059', '2027-02-28', 200, 0.23, true],
            ['Metoprolol 100 mg tab x20',           'Metoprolol tartrato',             0.65, 15, 'G1',  true, 'Cardiovascular', 'DYVENPRO Cía. Ltda.', 'FM-202503-060', '2027-05-31', 150, 0.33, true],
            ['Losartán 50 mg tab x14',              'Losartán potásico',               0.40, 20, 'G2',  true, 'Cardiovascular', 'Difare S.A.',          'FM-202502-061', '2027-04-30', 200, 0.20, true],
            ['Losartán 100 mg tab x14',             'Losartán potásico',               0.60, 15, 'G2',  true, 'Cardiovascular', 'Difare S.A.',          'FM-202503-062', '2027-06-30', 150, 0.30, true],
            ['Amlodipino 5 mg tab x10',             'Amlodipino besilato',             0.35, 20, 'G3',  true, 'Cardiovascular', 'Leterago del Ecuador', 'FM-202501-063', '2027-01-31', 200, 0.18, true],
            ['Amlodipino 10 mg tab x10',            'Amlodipino besilato',             0.55, 15, 'G3',  true, 'Cardiovascular', 'Leterago del Ecuador', 'FM-202502-064', '2027-03-31', 150, 0.28, false],
            ['Atorvastatina 20 mg tab x10',         'Atorvastatina cálcica',           0.60, 15, 'G4',  true, 'Cardiovascular', 'DYVENPRO Cía. Ltda.', 'FM-202503-065', '2027-07-31', 150, 0.30, false],
            ['Atorvastatina 40 mg tab x10',         'Atorvastatina cálcica',           0.85, 10, 'G4',  true, 'Cardiovascular', 'DYVENPRO Cía. Ltda.', 'FM-202504-066', '2027-08-31', 100, 0.43, false],
            ['Enalapril 10 mg tab x14',             'Enalapril maleato',               0.30, 20, 'G5',  true, 'Cardiovascular', 'Difare S.A.',          'FM-202501-067', '2027-02-28', 250, 0.15, false],
            ['Furosemida 40 mg tab x20',            'Furosemida',                      0.25, 20, 'G5',  true, 'Cardiovascular', 'Leterago del Ecuador', 'FM-202502-068', '2027-04-30', 200, 0.13, false],

            // ── DERMATOLOGÍA ──────────────────────────────────────────────────
            ['Clotrimazol 1% crema 20 g',           'Clotrimazol',                    3.50, 10, 'H1', false, 'Dermatología', 'Difare S.A.',          'FM-202503-069', '2028-03-31',  80, 1.75, true],
            ['Ketoconazol 2% crema 20 g',           'Ketoconazol',                    4.00, 10, 'H1', false, 'Dermatología', 'DYVENPRO Cía. Ltda.', 'FM-202504-070', '2028-04-30',  60, 2.00, true],
            ['Hidrocortisona 1% crema 20 g',        'Hidrocortisona acetato',          2.50, 10, 'H2', false, 'Dermatología', 'Leterago del Ecuador', 'FM-202503-071', '2028-01-31',  80, 1.25, true],
            ['Bacitracina + Neomicina crema 15 g', 'Bacitracina + Neomicina sulfato', 3.80, 10, 'H2', false, 'Dermatología', 'Difare S.A.',          'FM-202502-072', '2027-08-31',  60, 1.90, false],
            ['Tretinoína 0.025% crema 20 g',        'Tretinoína',                     6.50,  5, 'H3',  true, 'Dermatología', 'DYVENPRO Cía. Ltda.', 'FM-202504-073', '2028-04-30',  40, 3.25, false],
            ['Aciclovir 5% crema 5 g',              'Aciclovir',                      4.20, 10, 'H3', false, 'Dermatología', 'Leterago del Ecuador', 'FM-202503-074', '2028-03-31',  60, 2.10, false],
            ['Permetrina 1% loción 60 ml',          'Permetrina',                     5.50,  5, 'H4', false, 'Dermatología', 'Difare S.A.',          'FM-202502-075', '2027-06-30',  40, 2.75, false],
            ['Miconazol 2% polvo 40 g',             'Miconazol nitrato',               3.20, 10, 'H4', false, 'Dermatología', 'DYVENPRO Cía. Ltda.', 'FM-202503-076', '2028-02-28',  60, 1.60, false],
        ];

        $now = now()->toDateTimeString();

        foreach ([$matriz, $guano] as $sucursal) {
            $esGuano = $sucursal->id === $guano->id;
            $prefix  = $esGuano ? 'FG' : 'FM';

            foreach ($catalogo as $row) {
                [$nombre, $principio, $precio, $stockMin, $ubicacion, $receta,
                 $catKey, $provKey, $loteNum, $loteVenc, $loteCant, $loteCosto, $enGuano] = $row;

                if ($esGuano && !$enGuano) {
                    continue;
                }

                $med = Medicamento::firstOrCreate(
                    ['sucursal_id' => $sucursal->id, 'nombre_comercial' => $nombre],
                    [
                        'categoria_id'     => $cats[$catKey]->id,
                        'proveedor_id'     => $provs[$provKey]->id,
                        'principio_activo' => $principio,
                        'precio'           => $precio,
                        'stock_minimo'     => $stockMin,
                        'ubicacion_fisica' => $ubicacion,
                        'requiere_receta'  => $receta,
                        'activo'           => true,
                    ]
                );

                // Crear el lote inicial solo si el medicamento aún no tiene ninguno.
                // En re-ejecuciones del seeder se omite para no duplicar stock.
                if ($med->lotes()->doesntExist()) {
                    $loteNumSucursal = str_replace('FM-', $prefix . '-', $loteNum);

                    DB::table('lotes')->insert([
                        'medicamento_id'    => $med->id,
                        'sucursal_id'       => $sucursal->id,
                        'proveedor_id'      => $provs[$provKey]->id,
                        'numero_lote'       => $loteNumSucursal,
                        'fecha_vencimiento' => $loteVenc,
                        'fecha_ingreso'     => now()->subMonths(2)->toDateString(),
                        'cantidad_inicial'  => $loteCant,
                        'cantidad_actual'   => $loteCant,
                        'costo_unitario'    => $loteCosto,
                        'created_at'        => $now,
                        'updated_at'        => $now,
                    ]);
                }
            }
        }
    }
}
