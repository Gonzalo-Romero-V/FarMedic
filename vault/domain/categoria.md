---
status: stable
code_path: Backend/app/Models/Categoria.php
---

# Categoria

**Qué**: Clasificación de medicamentos (analgésico, antibiótico, antihistamínico, etc.).
**Por qué**: RF-01 requiere categoría en el registro de medicamentos. Facilita filtros de búsqueda en POS y catálogo, y agregaciones en reportes.

## Atributos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | int (pk) | |
| `nombre` | string (único) | Ej. "Analgésico", "Antibiótico", "Vitamina" |
| `descripcion` | string nullable | |
| `created_at`, `updated_at` | timestamp | |

## Relaciones

| Tipo | Con | Detalle |
|------|-----|---------|
| 1 → N | [[medicamento]] | `medicamento.categoria_id` |

## Reglas e invariantes

- Solo Administrador crea/edita/elimina categorías.
- No se elimina categoría con medicamentos asociados (FK restrict).

## Tabla SQL

`categorias`

## Relacionado

[[medicamento]] [[data-model]]
