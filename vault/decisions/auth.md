---
status: stable
code_path: Backend/app/Http/Controllers/Api/AuthController.php, Frontend/hooks/use-auth.tsx, Frontend/app/auth/callback/page.tsx
---

# Autenticación — Google OAuth + Login tradicional

**Qué**: Sistema de auth con dos canales: login tradicional (email + password) y Google OAuth para todos los roles ([[usuario]] interno + [[cliente]] externo).
**Por qué**: Decisión de stack: todo el flujo de auth vive en backend (Laravel Socialite + Sanctum) para simplificar tokens, sesiones y políticas.

## Estrategia

| Aspecto | Valor |
|---------|-------|
| OAuth library | Laravel Socialite |
| Token strategy | Sanctum personal access tokens (Bearer) |
| Flow | **Server-side** — el navegador del usuario navega al backend, que redirige a Google y procesa el callback |
| Frontend recibe | Token Bearer via redirect con query param (`?token=XYZ`) |
| Persistencia Frontend | `localStorage` (`auth_token`, `auth_user`) vía `AuthContext` |
| Tabla persistencia tokens | `personal_access_tokens` (migración de Sanctum) |
| Modelo con `HasApiTokens` | [[usuario]] (`Backend/app/Models/Usuario.php`) |

## Variables de entorno (`Backend/.env`)

| Variable | Origen | Uso |
|----------|--------|-----|
| `GOOGLE_CLIENT_ID` | Google Cloud Console | Identifica la app |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console | Firma para intercambio |
| `GOOGLE_REDIRECT_URI` | `http://localhost:8000/auth/google/callback` | Callback Socialite |
| `FRONTEND_URL` | `http://localhost:3000` | Destino final tras OAuth |

### Fix Desarrollo (Windows/SSL)
En `config/services.php` se configuró `'guzzle' => ['verify' => false]` para evitar el error `cURL 60 (SSL certificate problem)` común en entornos locales sin `cacert.pem` configurado.

## Integración Frontend

Implementada mediante `AuthContext` en `Frontend/hooks/use-auth.tsx`:
- **AuthProvider**: Envuelve la app en `layout.tsx`, recupera sesión al cargar.
- **useAuth**: Hook para acceder a `user`, `token`, `login()` y `logout()`.
- **Protección**: `app/(private)/layout.tsx` redirige a `/login` si no hay token activo.
- **Redirección OAuth**: `app/auth/callback/page.tsx` procesa el token de la URL y solicita datos del usuario a `/api/auth/me`.

## Flujo OAuth (server-side)

```
1.  [Frontend]   GET → http://localhost:8000/auth/google/redirect
2.  [Backend]    Socialite redirect → Google
3.  [Google]     Consent → Callback (8000)
4.  [Backend]    Valida, findOrCreate Usuario, genera Sanctum Token
5.  [Backend]    302 → http://localhost:3000/auth/callback?token=...
6.  [Frontend]   Guarda token, navega a /dashboard
```

## Estado de implementación

| Pieza | Estado |
|-------|--------|
| Google Cloud OAuth client | ✅ Creado y activo |
| Sanctum + Socialite | ✅ Configurado y funcional |
| Formulario dinámico Login/Registro | ✅ `Frontend/app/(public)/login/page.tsx` |
| Protección de rutas privadas | ✅ `Frontend/app/(private)/layout.tsx` |
| Logout centralizado | ✅ Limpia localStorage y revoca en backend |

## Códigos de error del callback OAuth

El callback Google nunca lanza al frontend con HTTP 500; siempre redirige a `${FRONTEND_URL}/auth/callback?error=<code>` y `app/auth/callback/page.tsx` los traduce a toast:

| `error` query param | Mensaje en frontend | Caso |
|---------------------|---------------------|------|
| `oauth_failed` | "Error al autenticar con Google" | Socialite no pudo extraer el usuario (token expirado, scope rechazado) |
| `usuario_inactivo` | "Usuario inactivo" | Usuario existe pero `activo=false` |
| `internal_error` | "Error interno en el servidor" | Excepción en `findOrCreate` o `createToken` |
| (otro) | "Ocurrió un error inesperado" | Fallback genérico |

## Debouncing de notificaciones (`use-auth.tsx`)

`AuthProvider.login()` evita disparar el toast `"Bienvenido, {nombre}"` dos veces en menos de 2 segundos vía un timestamp en `window._last_auth_toast`. Justificación: en dev mode con React Strict Mode el flujo OAuth (callback → fetchUser → login) podía emitir el toast dos veces.

## Relacionado

[[stack]] [[arquitectura]] [[usuario]] [[cliente]] [[rol]] [[api-contracts]] [[design-system]]
