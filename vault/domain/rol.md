---
status: stable
code_path: Backend/app/Models/Rol.php
---

# Rol

**Qué**: Tabla de roles del sistema con FK desde la tabla física `usuarios` (compartida por [[usuario]] interno y [[cliente]] externo).
**Por qué**: Centraliza autorización. Las Laravel Policies deciden permisos en base a `usuario.rol_id`.

## Atributos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | int (pk) | |
| `nombre` | string (único) | `administrador`, `empleado`, `cliente` |
| `descripcion` | string | |
| `created_at`, `updated_at` | timestamp | |

## Filas iniciales (seed)

| id | nombre | descripcion |
|----|--------|-------------|
| 1 | administrador | Acceso total al sistema |
| 2 | empleado | POS, gestión de pedidos e inventario limitado |
| 3 | cliente | Catálogo y pedidos online propios |

## Relaciones

| Tipo | Con | Detalle |
|------|-----|---------|
| 1 → N | [[usuario]] | `usuarios.rol_id` (cuando es admin/empleado) |
| 1 → N | [[cliente]] | `usuarios.rol_id` (cuando es cliente — misma tabla física) |

## Reglas e invariantes

- Los 3 roles son **fijos** en MVP. No se crean en runtime.
- Granularidad fina (permisos por acción) se implementa en Laravel Policies/Gates, NO en una tabla `permisos` separada.
- Cambio de rol de un usuario existente requiere autorización de Administrador.

## Tabla SQL

`roles`

## Relacionado

[[usuario]] [[cliente]] [[data-model]]
