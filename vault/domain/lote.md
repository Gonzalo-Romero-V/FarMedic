---
status: stable
code_path: Backend/app/Models/Lote.php
---

# Lote

**Qué**: Partida de stock de un [[medicamento]] con fecha de vencimiento propia.
**Por qué**: Control de caducidad por lote y trazabilidad Kardex (RF-03, RF-04).

## Atributos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | int (pk) | |
| `medicamento_id` | int (fk) | → [[medicamento]] |
| `sucursal_id` | int (fk) | → [[sucursal]] (denormalizado, igual al del medicamento) |
| `proveedor_id` | int (fk) | → [[proveedor]] que entregó este lote |
| `numero_lote` | string | Identificador del fabricante |
| `fecha_vencimiento` | date (indexed) | Para queries de alertas |
| `fecha_ingreso` | date | |
| `cantidad_inicial` | int | Cantidad recibida originalmente |
| `cantidad_actual` | int | Stock actual (denormalizado, auditable vía [[movimiento-stock]]) |
| `costo_unitario` | decimal(10,2) | Precio de adquisición unitario |
| `created_at`, `updated_at` | timestamp | |

## Relaciones

| Tipo | Con | Detalle |
|------|-----|---------|
| N → 1 | [[medicamento]] | `medicamento_id` |
| N → 1 | [[sucursal]] | `sucursal_id` |
| N → 1 | [[proveedor]] | `proveedor_id` |
| 1 → N | [[movimiento-stock]] | `movimiento_stock.lote_id` |
| 1 → N | [[venta-item]] | `venta_item.lote_id` |
| 1 → N | [[pedido-item]] | `pedido_item.lote_id` |

## Reglas e invariantes

- `cantidad_actual ≥ 0` siempre. Validar antes de cualquier descuento.
- **Estado computado** (derivado de `fecha_vencimiento` vs hoy):
  - `vigente`: fecha > hoy + 30 días
  - `proximo_a_vencer`: hoy ≤ fecha ≤ hoy + 30 días → alerta amarilla (RF-03)
  - `vencido`: fecha < hoy → alerta roja (RF-03)
- **FEFO** (First-Expired-First-Out): al vender o reservar para pedido, descontar del lote con `fecha_vencimiento` más próxima primero.
- `cantidad_actual` se actualiza en cada movimiento; la fuente de verdad auditable son los [[movimiento-stock]]s.
- Sum(cantidad de movimientos del lote) == `cantidad_actual` (invariante verificable).

## Tabla SQL

`lotes`

## Relación indirecta con transacciones

El [[lote]] se descuenta indirectamente al confirmar una [[venta]] o un [[pedido]] — el FK directo está en sus respectivos `*_item` (FEFO).

## Relacionado

[[medicamento]] [[movimiento-stock]] [[venta-item]] [[pedido-item]] [[venta]] [[pedido]] [[proveedor]] [[sucursal]] [[data-model]]
