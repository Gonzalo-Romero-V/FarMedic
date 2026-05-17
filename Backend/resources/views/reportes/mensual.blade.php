<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte mensual {{ $periodo['mes_label'] }}</title>
    <style>
        /* DOMPDF soporta CSS2 + algunas features de CSS3. Estilos inline-friendly. */
        @page { margin: 1.5cm 1.2cm; }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10pt;
            color: #1a1a1a;
            line-height: 1.4;
        }
        .header {
            border-bottom: 2px solid #14a67c;
            padding-bottom: 8px;
            margin-bottom: 14px;
        }
        .header h1 {
            margin: 0 0 4px;
            font-size: 18pt;
            color: #14a67c;
        }
        .header .period {
            font-size: 12pt;
            font-weight: 600;
            text-transform: capitalize;
        }
        .header .meta {
            font-size: 9pt;
            color: #555;
            margin-top: 4px;
        }

        h2 {
            font-size: 13pt;
            color: #07598c;
            margin: 18px 0 6px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 3px;
        }
        h3 {
            font-size: 11pt;
            color: #333;
            margin: 12px 0 4px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 6px 0 10px;
        }
        th {
            background: #f3f3f3;
            text-align: left;
            padding: 4px 6px;
            font-size: 9pt;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.4pt;
            color: #555;
            border-bottom: 1px solid #ccc;
        }
        td {
            padding: 4px 6px;
            border-bottom: 1px solid #eee;
            font-size: 10pt;
        }
        .num { text-align: right; font-variant-numeric: tabular-nums; }
        .total-row { font-weight: 600; background: #fafafa; }
        .muted { color: #777; }
        .empty {
            color: #777;
            font-style: italic;
            padding: 8px;
            text-align: center;
            font-size: 9pt;
        }

        .footer {
            margin-top: 24px;
            border-top: 1px solid #ddd;
            padding-top: 6px;
            font-size: 8pt;
            color: #777;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $farmacia->nombre ?? 'FarMedic' }}</h1>
        <div class="period">Reporte mensual — {{ $periodo['mes_label'] }}</div>
        <div class="meta">
            Período: {{ $periodo['desde'] }} a {{ $periodo['hasta'] }}
            @if($farmacia) · RUC {{ $farmacia->ruc }} @endif
            · Generado: {{ \Carbon\Carbon::parse($generado_en)->format('d/m/Y H:i') }}
        </div>
    </div>

    {{-- ============================ Ventas ============================ --}}
    <h2>Ventas</h2>

    <h3>Totalizado</h3>
    @if(($ventas['totalizado']->cantidad ?? 0) == 0)
        <p class="empty">Sin ventas registradas en el período.</p>
    @else
        <table>
            <thead>
                <tr>
                    <th>Operaciones</th>
                    <th class="num">Subtotal</th>
                    <th class="num">IVA</th>
                    <th class="num">Total</th>
                </tr>
            </thead>
            <tbody>
                <tr class="total-row">
                    <td>{{ $ventas['totalizado']->cantidad }}</td>
                    <td class="num">${{ number_format($ventas['totalizado']->subtotal, 2) }}</td>
                    <td class="num">${{ number_format($ventas['totalizado']->impuesto_total, 2) }}</td>
                    <td class="num">${{ number_format($ventas['totalizado']->total, 2) }}</td>
                </tr>
            </tbody>
        </table>

        <h3>Por sucursal</h3>
        <table>
            <thead>
                <tr>
                    <th>Sucursal</th>
                    <th>Ciudad</th>
                    <th class="num">Operaciones</th>
                    <th class="num">Subtotal</th>
                    <th class="num">IVA</th>
                    <th class="num">Total</th>
                </tr>
            </thead>
            <tbody>
                @forelse($ventas['por_sucursal'] as $row)
                    <tr>
                        <td>{{ $row->nombre }}</td>
                        <td class="muted">{{ $row->ciudad }}</td>
                        <td class="num">{{ $row->cantidad }}</td>
                        <td class="num">${{ number_format($row->subtotal, 2) }}</td>
                        <td class="num">${{ number_format($row->impuesto_total, 2) }}</td>
                        <td class="num">${{ number_format($row->total, 2) }}</td>
                    </tr>
                @empty
                    <tr><td colspan="6" class="empty">Sin ventas por sucursal.</td></tr>
                @endforelse
            </tbody>
        </table>

        <h3>Por método de pago</h3>
        <table>
            <thead>
                <tr>
                    <th>Método</th>
                    <th class="num">Operaciones</th>
                    <th class="num">Total</th>
                </tr>
            </thead>
            <tbody>
                @forelse($ventas['por_metodo'] as $row)
                    <tr>
                        <td style="text-transform: capitalize;">{{ $row->metodo_pago }}</td>
                        <td class="num">{{ $row->cantidad }}</td>
                        <td class="num">${{ number_format($row->total, 2) }}</td>
                    </tr>
                @empty
                    <tr><td colspan="3" class="empty">Sin ventas.</td></tr>
                @endforelse
            </tbody>
        </table>
    @endif

    {{-- ============================ Top productos ============================ --}}
    <h2>Productos más vendidos</h2>
    @if(empty($top_productos))
        <p class="empty">Sin ventas registradas en el período.</p>
    @else
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Medicamento</th>
                    <th>Principio activo</th>
                    <th class="num">Unidades</th>
                    <th class="num">Ventas</th>
                    <th class="num">Monto</th>
                </tr>
            </thead>
            <tbody>
                @foreach($top_productos as $i => $row)
                    <tr>
                        <td class="muted">{{ $i + 1 }}</td>
                        <td>{{ $row->nombre_comercial }}</td>
                        <td class="muted">{{ $row->principio_activo }}</td>
                        <td class="num">{{ $row->unidades }}</td>
                        <td class="num">{{ $row->ventas_distintas }}</td>
                        <td class="num">${{ number_format($row->monto, 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    {{-- ============================ Stock crítico ============================ --}}
    <h2>Stock crítico al cierre del período</h2>
    @if(empty($stock_critico))
        <p class="empty">
            @if(\Carbon\Carbon::parse($periodo['hasta'])->isFuture())
                Período aún no cerrado — el snapshot se calcula al final del mes.
            @else
                Sin medicamentos bajo el mínimo. Stock saludable.
            @endif
        </p>
    @else
        @foreach($stock_critico as $bloque)
            <h3>{{ $bloque['sucursal'] }}</h3>
            <table>
                <thead>
                    <tr>
                        <th>Medicamento</th>
                        <th class="num">Stock actual</th>
                        <th class="num">Stock mínimo</th>
                        <th class="num">Diferencia</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($bloque['items'] as $item)
                        <tr>
                            <td>{{ $item->medicamento_nombre }}</td>
                            <td class="num">{{ $item->stock_actual }}</td>
                            <td class="num">{{ $item->stock_minimo }}</td>
                            <td class="num" style="color: #c00;">
                                −{{ max(0, $item->stock_minimo - $item->stock_actual) }}
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @endforeach
    @endif

    {{-- ============================ Kardex resumen ============================ --}}
    <h2>Movimientos de stock (Kardex)</h2>

    <h3>Totalizado por tipo</h3>
    <table>
        <thead>
            <tr>
                <th>Tipo</th>
                <th class="num">Movimientos</th>
                <th class="num">Unidades (abs)</th>
            </tr>
        </thead>
        <tbody>
            @forelse($kardex['totalizado'] as $row)
                <tr>
                    <td style="text-transform: capitalize;">{{ str_replace('_', ' ', $row->tipo) }}</td>
                    <td class="num">{{ $row->cantidad }}</td>
                    <td class="num">{{ $row->unidades }}</td>
                </tr>
            @empty
                <tr><td colspan="3" class="empty">Sin movimientos en el período.</td></tr>
            @endforelse
        </tbody>
    </table>

    @if(!empty($kardex['por_sucursal']))
        <h3>Detalle por sucursal</h3>
        @foreach($kardex['por_sucursal'] as $bloque)
            <h3 style="font-size: 10pt; margin-top: 8px;">{{ $bloque['sucursal'] }}</h3>
            <table>
                <thead>
                    <tr>
                        <th>Tipo</th>
                        <th class="num">Movimientos</th>
                        <th class="num">Unidades</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($bloque['tipos'] as $t)
                        <tr>
                            <td style="text-transform: capitalize;">{{ str_replace('_', ' ', $t->tipo) }}</td>
                            <td class="num">{{ $t->cantidad }}</td>
                            <td class="num">{{ $t->unidades }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @endforeach
    @endif

    <div class="footer">
        FarMedic — Reporte generado automáticamente. Documento sin valor fiscal.
    </div>
</body>
</html>
