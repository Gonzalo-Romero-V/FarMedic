<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Comprobante {{ $venta->numero_comprobante }}</title>
    <style>
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
            font-size: 16pt;
            color: #14a67c;
        }
        .header .subtitle {
            font-size: 9pt;
            color: #555;
        }
        .comprobante-meta {
            float: right;
            text-align: right;
            font-size: 9pt;
            color: #333;
            margin-top: 2px;
        }
        .comprobante-meta strong {
            font-size: 11pt;
            color: #1a1a1a;
        }

        .partes {
            margin: 10px 0 14px;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            padding: 8px 10px;
            font-size: 9pt;
        }
        .partes table {
            width: 100%;
            border-collapse: collapse;
        }
        .partes td {
            padding: 2px 0;
            vertical-align: top;
        }
        .partes .label {
            color: #777;
            text-transform: uppercase;
            font-size: 8pt;
            letter-spacing: 0.4pt;
            width: 30%;
        }

        h2 {
            font-size: 11pt;
            color: #07598c;
            margin: 14px 0 6px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 3px;
        }

        table.items {
            width: 100%;
            border-collapse: collapse;
            margin: 4px 0 8px;
        }
        table.items th {
            background: #f3f3f3;
            text-align: left;
            padding: 4px 6px;
            font-size: 8pt;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3pt;
            color: #555;
            border-bottom: 1px solid #ccc;
        }
        table.items td {
            padding: 4px 6px;
            border-bottom: 1px solid #eee;
            font-size: 10pt;
        }
        .num { text-align: right; font-variant-numeric: tabular-nums; }

        .totales {
            margin-top: 8px;
            width: 50%;
            float: right;
        }
        .totales table {
            width: 100%;
            border-collapse: collapse;
        }
        .totales td {
            padding: 3px 8px;
            font-size: 10pt;
        }
        .totales .label-cell { color: #555; text-align: right; }
        .totales .total-row td {
            border-top: 2px solid #1a1a1a;
            padding-top: 6px;
            font-size: 12pt;
            font-weight: 700;
        }

        .footer {
            clear: both;
            margin-top: 32px;
            border-top: 1px solid #ddd;
            padding-top: 8px;
            font-size: 8pt;
            color: #777;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="comprobante-meta">
            <div><strong>{{ $venta->numero_comprobante }}</strong></div>
            <div>{{ \Carbon\Carbon::parse($venta->fecha)->format('d/m/Y H:i') }}</div>
        </div>
        <h1>{{ $farmacia->nombre ?? 'FarMedic' }}</h1>
        <div class="subtitle">
            @if($venta->sucursal)
                {{ $venta->sucursal->nombre }}@if($venta->sucursal->ciudad) · {{ $venta->sucursal->ciudad }}@endif
                @if($venta->sucursal->direccion) · {{ $venta->sucursal->direccion }}@endif
            @endif
            @if($farmacia && $farmacia->ruc) · RUC {{ $farmacia->ruc }}@endif
        </div>
    </div>

    <div class="partes">
        <table>
            <tr>
                <td class="label">Cliente</td>
                <td>{{ $venta->cliente?->nombre ?? 'Consumidor final' }}</td>
            </tr>
            <tr>
                <td class="label">Atendió</td>
                <td>{{ $venta->usuario?->nombre ?? '—' }}</td>
            </tr>
            <tr>
                <td class="label">Método de pago</td>
                <td style="text-transform: capitalize;">{{ $venta->metodo_pago }}</td>
            </tr>
            @if($venta->receta_id)
                <tr>
                    <td class="label">Receta</td>
                    <td>#{{ $venta->receta_id }}@if($venta->receta?->numero) — {{ $venta->receta->numero }}@endif</td>
                </tr>
            @endif
            @if($venta->estado === 'anulada')
                <tr>
                    <td class="label">Estado</td>
                    <td style="color: #c00; font-weight: 600; text-transform: uppercase;">Anulada</td>
                </tr>
            @endif
        </table>
    </div>

    <h2>Detalle</h2>
    <table class="items">
        <thead>
            <tr>
                <th>Medicamento</th>
                <th class="num">Cant.</th>
                <th class="num">P. unitario</th>
                @if($venta->items->contains(fn ($i) => (float) $i->descuento_item > 0))
                    <th class="num">Desc.</th>
                @endif
                <th class="num">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @php $mostrarDescuento = $venta->items->contains(fn ($i) => (float) $i->descuento_item > 0); @endphp
            @foreach($venta->items as $item)
                <tr>
                    <td>
                        {{ $item->lote?->medicamento?->nombre_comercial ?? ('Lote #' . $item->lote_id) }}
                        @if($item->lote?->medicamento?->principio_activo)
                            <div style="font-size: 8pt; color: #888;">{{ $item->lote->medicamento->principio_activo }}</div>
                        @endif
                    </td>
                    <td class="num">{{ $item->cantidad }}</td>
                    <td class="num">${{ number_format($item->precio_unitario, 2) }}</td>
                    @if($mostrarDescuento)
                        <td class="num">
                            @if((float) $item->descuento_item > 0)
                                −${{ number_format($item->descuento_item, 2) }}
                            @else
                                —
                            @endif
                        </td>
                    @endif
                    <td class="num">${{ number_format($item->subtotal, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totales">
        <table>
            <tr>
                <td class="label-cell">Subtotal</td>
                <td class="num">${{ number_format($venta->subtotal, 2) }}</td>
            </tr>
            @if((float) $venta->descuento_total > 0)
                <tr>
                    <td class="label-cell">Descuento global</td>
                    <td class="num">−${{ number_format($venta->descuento_total, 2) }}</td>
                </tr>
            @endif
            <tr>
                <td class="label-cell">IVA ({{ number_format($venta->iva_tasa_aplicada, 2) }}%)</td>
                <td class="num">${{ number_format($venta->impuesto_total, 2) }}</td>
            </tr>
            <tr class="total-row">
                <td class="label-cell">TOTAL</td>
                <td class="num">${{ number_format($venta->total, 2) }}</td>
            </tr>
        </table>
    </div>

    <div class="footer">
        ¡Gracias por su compra! · Documento simplificado sin valor fiscal.
    </div>
</body>
</html>
