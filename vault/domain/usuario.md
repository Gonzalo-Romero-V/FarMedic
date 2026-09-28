---
status: stable
code_path: Backend/app/Models/Usuario.php
---

# Usuario

**Qué**: Actor interno del sistema (Administrador o Empleado). Asociado a una [[sucursal]].
**Por qué**: Quien opera el POS, ajusta inventario, gestiona pedidos.

## Atributos (tabla física `usuarios`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | int (pk) | |
| `rol_id` | int (fk) | → [[rol]] — administrador o empleado |
| `sucursal_id` | int (fk) | → [[sucursal]] NOT NULL para usuarios internos |
| `nombre` | string | |
| `email` | string (único) | |
| `password` | string | Hash bcrypt (Laravel) |
| `google_oauth_id` | string nullable, único | Para login con Google |
| `telefono` | string nullable | |
| `direccion` | string nullable | Campo compartido con [[cliente]], no usado en internos |
| `activo` | boolean | |
| `email_verified_at` | timestamp nullable | |
| `created_at`, `updated_at` | timestamp | |

## Relaciones

| Tipo | Con | Detalle |
|------|-----|---------|
| N → 1 | [[rol]] | `rol_id` ∈ {administrador, empleado} |
| N → 1 | [[sucursal]] | `sucursal_id` |
| 1 → N | [[venta]] | `venta.usuario_id` (quien la realizó) |
| 1 → N | [[movimiento-stock]] | `movimiento_stock.usuario_id` (quien ajustó) |
| 1 → N | [[pedido]] | `pedido.usuario_id_gestor` |

## Reglas e invariantes

- Si `rol_id ∈ {administrador, empleado}` → `sucursal_id NOT NULL`.
- Solo Administrador puede crear/modificar/eliminar Usuarios (RNF-03).
- Distinción runtime con [[cliente]]: `WHERE roles.nombre IN ('administrador', 'empleado')`.

## Decisión: tabla física compartida con Cliente

Conceptualmente Usuario y [[cliente]] son distintos (interno vs externo). Físicamente comparten tabla `usuarios`:
- Auth única (Sanctum + Socialite)
- Email único cross-tipo
- Sanctum tokens y guards más simples

Ver [[data-model]] para el rationale completo.

## Tabla SQL

`usuarios` (compartida con [[cliente]])

## Relacionado

[[rol]] [[cliente]] [[sucursal]] [[venta]] [[movimiento-stock]] [[pedido]] [[data-model]]
