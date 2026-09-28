---
status: stable
code_path: Backend/app/Models/Receta.php
---

# Receta

**Qué**: Respaldo de receta médica para [[venta]]s o [[pedido]]s que contienen medicamentos con `requiere_receta=true`.
**Por qué**: RF-07 exige imagen o número de receta antes de confirmar la transacción cuando algún medicamento la requiere.

## Atributos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | int (pk) | |
| `numero` | string nullable | Número de receta si se ingresó manualmente |
| `imagen_url` | string nullable | URL de la imagen subida (storage local) |
| `doctor` | string nullable | Nombre del médico que la emitió |
| `fecha_emision` | date nullable | |
| `observaciones` | text nullable | |
| `created_at` | timestamp | |

## Relaciones

| Tipo | Con | Detalle |
|------|-----|---------|
| 1 → 0..1 | [[venta]] | `venta.receta_id` |
| 1 → 0..1 | [[pedido]] | `pedido.receta_id` |

## Reglas e invariantes

- Al menos uno entre `numero` y `imagen_url` debe estar presente (CHECK constraint o validación a nivel app).
- Una receta se asocia a **UNA sola transacción** (venta o pedido), no a múltiples.
- Almacenamiento de imágenes: filesystem Laravel local (ver [[stack]]).
- `imagen_url` referencia path relativo bajo `storage/app/private/recetas/` (no público).

## Tabla SQL

`recetas`

## Relacionado

[[venta]] [[pedido]] [[medicamento]] [[data-model]]
