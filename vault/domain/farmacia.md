---
status: stable
code_path: Backend/app/Models/Farmacia.php
---

# Farmacia

**Qué**: Entidad raíz del sistema. Representa la cadena/negocio bajo el cual operan una o más sucursales.
**Por qué**: Aísla configuración global (datos legales, IVA, branding) y permite multi-sucursal sobre una sola farmacia.

## Atributos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | int (pk) | |
| `nombre` | string | Nombre comercial |
| `ruc` | string (único) | Registro Único de Contribuyentes (Ecuador) |
| `logo_url` | string nullable | URL del logo |
| `iva_tasa` | decimal(5,2) | Tasa IVA aplicada en ventas (configurable por admin) |
| `telefono_contacto` | string | |
| `email_contacto` | string | |
| `created_at`, `updated_at` | timestamp | |

## Relaciones

| Tipo | Con | Detalle |
|------|-----|---------|
| 1 → N | [[sucursal]] | `sucursal.farmacia_id` |

## Reglas e invariantes

- En el MVP hay **una sola Farmacia** (la cadena). El modelo permite varias si en el futuro se expande a multi-tenant real.
- `ruc` es único en el sistema.
- `iva_tasa` solo modificable por Administrador (RNF-03).
- Cambios a `iva_tasa` NO afectan ventas/pedidos pasados — esos guardan snapshot en `iva_tasa_aplicada`.

## Tabla SQL

`farmacias`

## Relacionado

[[sucursal]] [[data-model]]
