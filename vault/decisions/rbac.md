---
status: stable
code_path: Frontend/lib/permissions/index.ts
---

# RBAC — Interfaces por rol (Frontend)

**Qué**: Arquitectura de UI con control de acceso por rol. Cada rol ([[rol]]) ve un layout, una navegación y un set de módulos diferentes. El "Invitado" (no autenticado) sólo accede al catálogo en modo lectura.

**Por qué**: Los 4 actores ([[usuario]] admin, [[usuario]] empleado, [[cliente]], invitado) tienen objetivos disjuntos. Mezclar todo en una sola UI condicional produce páginas saturadas, errores operativos y código frágil. La separación por prefijo de URL clarifica el contexto y hace el guard trivial.

## Decisión de arquitectura — prefijo URL por rol

| Rol BD (`rol.nombre`) | Slug URL | Prefijo |
|----------------------|----------|---------|
| `administrador` | `admin` | `/admin/*` |
| `empleado` | `empleado` | `/empleado/*` |
| `cliente` | `cliente` | `/cliente/*` |
| (sin auth) | `invitado` | `/` y `/catalogo` (público) |

**Por qué prefijo y no route groups**: Next.js route groups `(admin)/(empleado)/...` bajo `(private)/` colisionan cuando dos roles necesitan la misma URL final (ej. `/dashboard`). Con prefijo explícito cada rol tiene su árbol propio y el middleware sabe a qué rol pertenece cada request por simple `pathname.startsWith()`.

**Por qué `admin` y no `administrador`**: convención UX corta y universal. El mapping rol→slug vive en `Frontend/lib/permissions/role-routes.ts` (`ROLE_URL_PREFIX`).

## Defensa en profundidad (4 capas)

1. **Backend (autoridad real)**: `auth:sanctum` + middleware `role:administrador,empleado` + Policies por entidad. Único enforcement con valor de seguridad. Ver [[api-contracts]] y [[auth]].
2. **Edge middleware** (`Frontend/middleware.ts`): lee cookies `auth_token` y `auth_role`, redirige antes de SSR. Bloquea acceso a árboles que no corresponden al rol y manda al login si no hay sesión.
3. **Layout guard de rol** (`components/auth/require-role.tsx`): envuelve cada `(private)/<rol>/layout.tsx`. Si runtime detecta inconsistencia (rol cambió, cookie purgada), redirige a la home propia del rol o a `/login`.
4. **Permission map** (`lib/permissions/`): controla visibilidad fina de UI (botones, menú items). No es seguridad — es UX. Si el usuario manipula DevTools y muestra un botón oculto, el backend igual rechazará la acción.

**Regla de oro**: el frontend nunca decide solo. Cada UI gate refleja lo que el backend ya enforce. Si el backend responde 403, la UI lo manda a la home del rol.

## Estructura del frontend

```
Frontend/app/
├── (public)/                          HeaderPublic — invitado
│   ├── catalogo/                      /catalogo            ← read-only
│   └── ...
│
├── (private)/                         AuthGuard (token requerido)
│   ├── layout.tsx                     ← solo chequea token
│   ├── perfil/                        /perfil              compartido
│   │
│   ├── admin/                         HeaderAdmin + RequireRole("administrador")
│   │   ├── layout.tsx
│   │   ├── dashboard/, sucursales/, usuarios/, catalogo/
│   │   ├── inventario/                Kardex global
│   │   │   ├── kardex/, lotes/, ajustes/
│   │   ├── reportes/, auditoria/
│   │
│   ├── empleado/                      HeaderEmpleado + RequireRole("empleado")
│   │   ├── layout.tsx
│   │   ├── dashboard/                 métricas de sucursal
│   │   ├── pos/                       Punto de venta
│   │   └── stock/                     operaciones de inventario local
│   │       ├── inventario/, kardex/, entradas/
│   │       ├── devoluciones/, lotes/
│   │
│   └── cliente/                       HeaderCliente + RequireRole("cliente")
│       ├── layout.tsx
│       ├── dashboard/, pedidos/, pedidos/[id]/, perfil/
│
├── auth/callback/, logout/
└── layout.tsx                         root — ThemeProvider + AuthProvider

Frontend/components/layout/
├── header-shell.tsx, aside-shell.tsx   componentes base (chrome común)
├── header-public.tsx, aside-public.tsx
├── header-admin.tsx, aside-admin.tsx
├── header-empleado.tsx, aside-empleado.tsx
└── header-cliente.tsx, aside-cliente.tsx

Frontend/components/auth/
├── role-gate.tsx                       <RoleGate> visibility por rol/permiso
└── require-role.tsx                    Wrapper para layouts (redirect si no matchea)

Frontend/lib/permissions/
├── index.ts                            ROLES, PERMISSIONS, PERMISSIONS_BY_ROLE, isRole, barrel
├── role-routes.ts                      ROLE_URL_PREFIX, ROLE_HOME, homeForRole, roleFromPathname
└── can.ts                              can(role, perm), canAll, canAny

Frontend/hooks/use-permissions.tsx      hook que combina useAuth + can
Frontend/middleware.ts                  edge guard
```

## Permission map

`Frontend/lib/permissions/index.ts` define los permisos:

| Permiso | Admin | Empleado | Cliente | Invitado |
|---------|:-----:|:--------:|:-------:|:--------:|
| `catalog.read` | ✅ | ✅ | ✅ | ✅ |
| `catalog.manage` | ✅ | — | — | — |
| `pos.sell` | — | ✅ | — | — |
| `stock.read.local` | — | ✅ | — | — |
| `stock.read.global` | ✅ | — | — | — |
| `stock.write.local` | — | ✅ | — | — |
| `stock.write.global` | ✅ | — | — | — |
| `kardex.read.local` | — | ✅ | — | — |
| `kardex.read.global` | ✅ | — | — | — |
| `lotes.manage.local` | — | ✅ | — | — |
| `lotes.manage.global` | ✅ | — | — | — |
| `stock.adjust` (manual + justif.) | ✅ | — | — | — |
| `orders.create` | — | — | ✅ | — |
| `orders.read.own` | — | — | ✅ | — |
| `orders.read.all` | ✅ | ✅ | — | — |
| `orders.manage` | ✅ | ✅ | — | — |
| `returns.create.local` | — | ✅ | — | — |
| `users.manage` | ✅ | — | — | — |
| `sucursales.manage` | ✅ | — | — | — |
| `reports.view` | ✅ | — | — | — |
| `audit.view` | ✅ | — | — | — |
| `profile.edit.own` | ✅ | ✅ | ✅ | — |

**Sufijos**:
- `.local` — limitado a `sucursal_id` del usuario logueado. Aplicado en backend con `where('sucursal_id', auth()->user()->sucursal_id)`.
- `.global` — atraviesa todas las sucursales.

## Flujo post-login

1. Usuario completa login tradicional u OAuth.
2. `useAuth.login(token, user)` persiste en `localStorage` **y** setea cookies (`auth_token`, `auth_role`) con `SameSite=Lax`, `max-age=7d`.
3. La página llama `homeForRole(user.rol.nombre)`:
   - `administrador` → `/admin/dashboard`
   - `empleado` → `/empleado/dashboard`
   - `cliente` → `/cliente/dashboard`
4. El middleware corre antes del render: si las cookies coinciden, deja pasar. Si no, redirige.
5. `RequireRole` (en el layout del rol) corre en cliente y captura cualquier divergencia residual.

## Cookies — limitaciones de seguridad

Las cookies se setean desde JS (no son `HttpOnly`), por lo que un ataque XSS podría leerlas igual que `localStorage`. **El propósito de las cookies aquí es enrutar, no autenticar**: el backend valida el Bearer token en cada request y es quien realmente decide. Si se quisiera proteger el token contra XSS, habría que pasar la emisión a backend con `Set-Cookie: HttpOnly; Secure` — cambio mayor pendiente.

## Módulos pendientes de modelo

| Módulo | Estado | Razón |
|--------|--------|-------|
| Transferencias entre sucursales | ❌ no implementado | El enum `tipo` de [[movimiento-stock]] no incluye `transferencia`. Diseñar entidad `Transferencia` o modelar como par de `ajuste` con referencia común. Decisión pendiente. |
| Ajustes manuales (Empleado) | ❌ excluido | `tipo='ajuste'` exige `rol=administrador` por regla del modelo. Empleados no ajustan stock directamente. |

## Convenciones

1. **Una sola fuente de verdad para permisos**: `PERMISSIONS_BY_ROLE` en `lib/permissions/index.ts`. No comparar `user.rol.nombre === "..."` en componentes sueltos — usar `usePermissions().can("...")`.
2. **No usar `RoleGate` para seguridad** — solo para UX. Los datos sensibles deben llegar paginados o bloqueados desde el backend.
3. **Nav links por rol**: viven en `aside-{rol}.tsx` exportados como `{rol}NavLinks`. Cambiar ahí afecta tanto el header desktop como el aside mobile.
4. **`matchPrefix` en `NavLink`** marca el link como activo cuando el pathname empieza con el prefijo. Útil para módulos con subrutas (`/empleado/stock/*`).
5. **No cross-link entre árboles de rol.** Cada `{rol}NavLinks` solo apunta a su propio prefijo. Si un concepto existe en dos contextos (ej. `Catálogo` para invitado y para cliente), se duplica la ruta:
   - `/catalogo` — invitado, read-only, CTA de login.
   - `/cliente/catalogo` — cliente autenticado, con carrito y acciones.
   - `/admin/catalogo` — gestión CRUD.
   Cuando se implemente la vista real, las tres páginas reutilizan un componente compartido (ej. `<CatalogList>`) y se diferencian solo en sus acciones. Linkear fuera del prefijo rompe el layout: el usuario sale del chrome de su rol y aterriza en el del invitado.

## Relacionado

[[rol]] [[usuario]] [[cliente]] [[arquitectura]] [[design-system]] [[auth]] [[api-contracts]] [[movimiento-stock]]
