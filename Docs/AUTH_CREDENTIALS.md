# Credenciales de Autenticación (Desarrollo)

Este documento contiene los usuarios de prueba creados automáticamente por el sistema al ejecutar las migraciones con seeders.

## Usuarios del sistema

| Rol | Email | Password | Propósito |
|-----|-------|----------|-----------|
| **Administrador** | `admin@farmedic.local` | `FarMedic2026!` | Gestión completa (Catálogo, Usuarios, Sucursales, POS) |
| **Empleado** | *(Crear vía Admin)* | - | POS y gestión de inventario |
| **Cliente** | *(Registro libre)* | - | Pedidos online |

---

## Flujo de inicio de sesión

1. **Tradicional**: Usar `email` y `password` en la pantalla de `/login`.
2. **OAuth (Google)**: El sistema permite el acceso mediante Google. Si el email de Google coincide con un usuario existente, se vinculan las cuentas.

## Configuración del entorno

- **Backend**: `http://localhost:8000`
- **Frontend**: `http://localhost:3000`
- **Redirect OAuth**: `http://localhost:8000/auth/google/redirect`
