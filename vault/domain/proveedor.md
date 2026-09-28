---
status: stable
code_path: Backend/app/Models/Proveedor.php
---

# Proveedor

**Qué**: Empresa que provee medicamentos a la farmacia.
**Por qué**: RF-01 requiere proveedor en el registro de medicamentos. Permite trazar origen del [[lote]] para devoluciones y auditorías.

## Atributos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | int (pk) | |
| `nombre` | string | |
| `ruc` | string (único, nullable) | |
| `telefono` | string nullable | |
| `email` | string nullable | |
| `direccion` | string nullable | |
| `activo` | boolean | Default true; soft delete cuando deja de operar |
| `created_at`, `updated_at`, `deleted_at` | timestamp | Soft deletes |

## Relaciones

| Tipo | Con | Detalle |
|------|-----|---------|
| 1 → N | [[medicamento]] | `medicamento.proveedor_id` — proveedor habitual del producto |
| 1 → N | [[lote]] | `lote.proveedor_id` — quién entregó este lote específico |

## Reglas e invariantes

- Un medicamento tiene un proveedor "habitual", pero cada lote puede venir de un proveedor distinto.
- Si se requiere multi-proveedor habitual por medicamento → promover a tabla pivot `medicamento_proveedor` (no en MVP).
- Solo Administrador gestiona proveedores.

## Tabla SQL

`proveedores`

## Relacionado

[[medicamento]] [[lote]] [[data-model]]
