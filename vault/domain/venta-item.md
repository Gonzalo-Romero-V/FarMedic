---
status: stable
code_path: Backend/app/Models/VentaItem.php
---

# Venta Item

**Qué**: Línea de una [[venta]]. Una cantidad específica desde un [[lote]] particular.
**Por qué**: Detalle granular de la transacción que permite Kardex preciso (qué lote se descontó) y auditoría de precios históricos (snapshots).

## Atributos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | int (pk) | |
| `venta_id` | int (fk) | → [[venta]] |
| `lote_id` | int (fk) | → [[lote]] específico descontado (FEFO) |
| `cantidad` | int | |
| `precio_unitario` | decimal(10,2) | **Snapshot** del precio del [[medicamento]] al momento |
| `descuento_item` | decimal(10,2) | Default 0; descuento por línea |
| `subtotal` | decimal(10,2) | (cantidad × precio_unitario) − descuento_item |
| `created_at` | timestamp | |

## Relaciones

| Tipo | Con | Detalle |
|------|-----|---------|
| N → 1 | [[venta]] | `venta_id` |
| N → 1 | [[lote]] | `lote_id` |

## Reglas e invariantes

- `cantidad ≤ lote.cantidad_actual` al momento de la venta.
- `precio_unitario` es snapshot (no FK al medicamento), para preservar precios históricos si el medicamento cambia su precio.
- Asignación de lote: **FEFO** — lote con `fecha_vencimiento` más próxima primero.
- `subtotal` ≥ 0; `descuento_item ≤ cantidad × precio_unitario`.
- Inmutable después de confirmar la venta (cambios solo vía anulación de la venta).

## Tabla SQL

`venta_items`

## Análogo

[[pedido-item]] — misma estructura para el canal online (con FK a `medicamento_id` adicional).

## Relacionado

[[venta]] [[lote]] [[medicamento]] [[pedido-item]] [[data-model]]
