---
status: stable
code_path: Backend/app/Models/MovimientoStock.php
---

# Movimiento de Stock (Kardex)

**Qué**: Registro auditable e inmutable de cada cambio de stock en un [[lote]].
**Por qué**: RF-04 exige Kardex con historial completo de movimientos para auditorías.

## Atributos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | int (pk) | |
| `lote_id` | int (fk) | → [[lote]] afectado |
| `sucursal_id` | int (fk) | → [[sucursal]] (denormalizado) |
| `usuario_id` | int (fk) nullable | → [[usuario]] que ejecutó (NULL si fue automático del sistema) |
| `tipo` | enum | Ver tabla de tipos abajo |
| `cantidad` | int | Positivo (entrada) o negativo (salida) — siempre signed |
| `referencia_tipo` | string nullable | Polimórfico: `Venta`, `Pedido`, `Ajuste`, `Proveedor` |
| `referencia_id` | int nullable | ID del documento relacionado |
| `justificacion` | text nullable | **Obligatoria** para `tipo='ajuste'` |
| `created_at` | timestamp | Fecha del movimiento (inmutable) |

## Tipos de movimiento

| Tipo | Signo | Genera referencia | Notas |
|------|-------|-------------------|-------|
| `ingreso` | + | `Proveedor` o NULL | Recepción de lote nuevo |
| `venta` | − | `Venta` | Auto al confirmar venta |
| `devolucion_cliente` | + | `Venta` | Cliente devuelve mercadería |
| `devolucion_proveedor` | − | `Proveedor` | Devolución al proveedor (lote defectuoso) |
| `ajuste` | ± | `Ajuste` (NULL ref_id) | Manual, requiere justificación + admin |
| `vencimiento` | − | NULL | Auto cuando lote vence |
| `perdida` | − | NULL | Rotura, robo, etc., requiere justificación |

## Relaciones

| Tipo | Con | Detalle |
|------|-----|---------|
| N → 1 | [[lote]] | `lote_id` |
| N → 1 | [[sucursal]] | `sucursal_id` |
| N → 1 | [[usuario]] | `usuario_id` (nullable si fue sistema) |
| N → 1 (polimórfica) | [[venta]] o [[pedido]] | `referencia_tipo` + `referencia_id` |

## Reglas e invariantes

- **Inmutable**: una vez creado no se edita. Si hubo error → crear movimiento inverso con justificación.
- `tipo='ajuste'` requiere `justificacion` no vacía Y `usuario_id` con rol Administrador (RF-04).
- `tipo='perdida'` requiere `justificacion`.
- Tipos `venta`, `devolucion_cliente`: `referencia_tipo='Venta'` + `referencia_id` no nulo.
- `cantidad` distinto de 0 siempre.
- Suma de `cantidad` de todos los movimientos de un lote == `lote.cantidad_actual` (invariante verificable por job).

## Tabla SQL

`movimientos_stock`

## Relacionado

[[lote]] [[usuario]] [[venta]] [[pedido]] [[sucursal]] [[data-model]]
