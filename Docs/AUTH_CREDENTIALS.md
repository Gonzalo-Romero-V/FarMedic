# FarMedic — Credenciales de acceso

> **Este archivo no contiene contraseñas.** Las contraseñas se definen por variables de entorno
> (`Backend/.env`, y el panel de Environment en Render) y nunca se versionan.

---

## Usuarios del sistema (sembrados)

| Rol | Email | Contraseña | Propósito |
|-----|-------|------------|-----------|
| **Administrador** | `admin@farmedic.local` | variable `SEED_ADMIN_PASSWORD` (si falta, el admin no se crea) | Acceso total: catálogo, usuarios, sucursales, POS, reportes |
| **Empleado** | *(crear vía panel Admin)* | — | POS y gestión de inventario |
| **Cliente** | *(registro libre o Google OAuth)* | — | Catálogo y pedidos online |

---

## Acceso en producción

| Recurso | URL |
|---------|-----|
| App | https://far-medic.vercel.app/login |
| API Base | https://farmedic.onrender.com/api |

## Acceso en desarrollo local

| Recurso | URL |
|---------|-----|
| App | http://localhost:3000/login |
| API Base | http://localhost:8000/api |
| OAuth Redirect | http://localhost:8000/auth/google/callback |

---

## Flujos de autenticación

### Login tradicional
- Endpoint: `POST /api/auth/login` → devuelve Bearer token
- El frontend almacena el token en cookies `auth_token` + `auth_role`

### Google OAuth
1. Usuario hace clic en "Continuar con Google"
2. Frontend redirige a `GET /auth/google/redirect`
3. Google autentica y redirige a `/auth/google/callback`
4. Backend crea o vincula el usuario (rol `cliente` por defecto) y emite token
5. Backend redirige a `{FRONTEND_URL}/auth/callback?token=...`
6. Frontend captura el token y establece las cookies

### Cambio de rol a empleado/admin
Los clientes que se registran via Google reciben rol `cliente`. Para elevar a `empleado` o `administrador`:
1. Ingresar al panel Admin con `admin@farmedic.local`
2. Ir a Usuarios → buscar por email → cambiar rol y asignar sucursal

---

## Google Cloud Console

- Proyecto: `FarMedic`
- Client ID: ver Google Cloud Console → APIs & Services → Credentials → FarMedic OAuth 2.0
- Pantalla de consentimiento: **Testing** (solo usuarios de prueba autorizados)
- Usuarios de prueba autorizados: `chaloromerov3@gmail.com`

Para agregar más usuarios de prueba: Google Cloud Console → APIs & Services → OAuth consent screen → Test users.
Para pasar a producción: cambiar de Testing → Production y completar verificación de Google.
