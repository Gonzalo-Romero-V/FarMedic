---
status: stable
code_path: Backend/app/Models/Medicamento.php
---

# Medicamento

**Qué**: Producto farmacéutico del catálogo. Entidad central del sistema.
**Por qué**: Todo flujo operativo (venta, inventario, pedido, alerta) pivota sobre el medicamento.

## Atributos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | int (pk) | |
| `sucursal_id` | int (fk) | → [[sucursal]] (multi-tenancy) |
| `categoria_id` | int (fk) | → [[categoria]] |
| `proveedor_id` | int (fk) | → [[proveedor]] (habitual) |
| `nombre_comercial` | string (indexed) | Nombre de marca |
| `principio_activo` | string (indexed) | Sustancia activa — eje de búsqueda y sustitución (RF-05) |
| `codigo_barras` | string nullable, indexed, único por sucursal | Búsqueda rápida en POS (RF-05) |
| `precio` | decimal(10,2) | Precio unitario de venta |
| `stock_minimo` | int | Umbral para alerta de stock crítico (RF-14) |
| `ubicacion_fisica` | string | Ej. "Estantería A, Cajón 3" (RF-02) |
| `requiere_receta` | boolean | Bloquea venta sin receta adjunta (RF-07) |
| `activo` | boolean | |
| `created_at`, `updated_at`, `deleted_at` | timestamp | Soft deletes |

## Relaciones

| Tipo | Con | Detalle |
|------|-----|---------|
| N → 1 | [[sucursal]] | `sucursal_id` |
| N → 1 | [[categoria]] | `categoria_id` |
| N → 1 | [[proveedor]] | `proveedor_id` (habitual) |
| 1 → N | [[lote]] | `lote.medicamento_id` |
| 1 → N | [[pedido-item]] | `pedido_item.medicamento_id` (referencia estable) |

## Reglas e invariantes

- `principio_activo` obligatorio e indexado (búsqueda RF-05).
- `precio` solo modificable por Administrador (RNF-03).
- `stock_minimo` debe definirse al crear (RF-14).
- Si `requiere_receta = true` → POS y portal online exigen [[receta]] antes de confirmar transacción.
- Stock agregado del medicamento = suma de `cantidad_actual` de sus [[lote]]s vigentes.
- Soft delete: medicamento dado de baja sigue existiendo para preservar historial de ventas pasadas.

## Tabla SQL

`medicamentos`

## Relación indirecta con transacciones

Se vende vía [[venta-item]] (referencia indirecta a [[venta]]) y se pide vía [[pedido-item]] (referencia directa por `medicamento_id` en el item del pedido).

## Relacionado

[[categoria]] [[proveedor]] [[lote]] [[venta-item]] [[venta]] [[pedido-item]] [[pedido]] [[receta]] [[sucursal]] [[data-model]]
