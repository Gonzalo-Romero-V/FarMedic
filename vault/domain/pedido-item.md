---
status: stable
code_path: Backend/app/Models/PedidoItem.php
---

# Pedido Item

**Qué**: Línea de un [[pedido]] online. Análogo a [[venta-item]] pero para canal web.
**Por qué**: Detalle granular del pedido con asignación específica de [[lote]] al momento de confirmar (reserva FEFO).

## Atributos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | int (pk) | |
| `pedido_id` | int (fk) | → [[pedido]] |
| `medicamento_id` | int (fk) | → [[medicamento]] (referencia estable independiente del lote) |
| `lote_id` | int (fk) nullable | → [[lote]] (asignado al confirmar; NULL durante borrador del carrito si aplicara) |
| `cantidad` | int | |
| `precio_unitario` | decimal(10,2) | **Snapshot** del precio al momento |
| `subtotal` | decimal(10,2) | cantidad × precio_unitario |
| `created_at` | timestamp | |

## Relaciones

| Tipo | Con | Detalle |
|------|-----|---------|
| N → 1 | [[pedido]] | `pedido_id` |
| N → 1 | [[medicamento]] | `medicamento_id` — referencia estable |
| N → 1 | [[lote]] | `lote_id` — asignado FEFO al confirmar |

## Reglas e invariantes

- `lote_id` puede ser NULL hasta que se confirma el pedido (reserva del lote).
- Al asignar lote: `cantidad ≤ lote.cantidad_actual` (FEFO).
- `precio_unitario` snapshot — no se actualiza si el [[medicamento]] cambia de precio después.
- Si el pedido se cancela antes de `entregado` → liberar reserva (no afecta stock real porque no se descontó aún).

## Tabla SQL

`pedido_items`

## Relacionado

[[pedido]] [[lote]] [[medicamento]] [[data-model]]
