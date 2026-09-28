---
status: stable
code_path: Backend/app/Models/Usuario.php
---

# Cliente

**Qué**: Actor externo del sistema. Se registra desde el canal online y realiza pedidos.
**Por qué**: Extiende el alcance comercial fuera del local físico (Módulo 3 del PDF).

## Atributos (tabla física `usuarios`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | int (pk) | |
| `rol_id` | int (fk) | → [[rol]] = cliente |
| `sucursal_id` | int (fk) nullable | NULL — cliente no pertenece a una sucursal específica |
| `nombre` | string | |
| `email` | string (único) | |
| `password` | string | Hash bcrypt |
| `google_oauth_id` | string nullable, único | Login con Google |
| `telefono` | string | **Privado** — visible solo en gestión de entregas |
| `direccion` | string | **Privado** — visible solo en gestión de entregas |
| `email_verified_at` | timestamp nullable | |
| `created_at`, `updated_at` | timestamp | |

## Relaciones

| Tipo | Con | Detalle |
|------|-----|---------|
| N → 1 | [[rol]] | `rol_id` = cliente |
| 1 → N | [[pedido]] | `pedido.cliente_id` |
| 1 → N | [[venta]] | `venta.cliente_id` (opcional, cuando el cliente registrado compra en mostrador) |
| -- | [[sucursal]] | Sin relación física (sucursal_id NULL) — un cliente puede pedir de cualquier sucursal |

## Reglas e invariantes

- **Privacidad (RNF-04)**: `telefono` y `direccion` solo accesibles desde contexto de gestión de entregas. No expuestos en otros módulos.
- Sin cuenta → modo **Invitado**: catálogo de solo lectura, NO puede crear pedidos.
- `sucursal_id` siempre NULL para clientes (puede pedir de cualquier sucursal de la cadena).
- Email único cross-tipo: no puede existir un email como cliente Y como empleado.

## Decisión: tabla física compartida con Usuario

Conceptualmente [[usuario]] (interno) y Cliente son distintos. Físicamente comparten tabla `usuarios` con FK a [[rol]] diferenciando. Ver [[data-model]] para rationale.

## Tabla SQL

`usuarios` (compartida con [[usuario]], distinguidos por `rol_id`)

## Relacionado

[[rol]] [[usuario]] [[pedido]] [[venta]] [[sucursal]] [[data-model]]
