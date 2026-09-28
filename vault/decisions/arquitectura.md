---
status: stable
---

# Arquitectura

**Estructura**: Monorepo — `Backend/` + `Frontend/` + `Docs/` desacoplados internamente
**Comunicación**: REST API — Laravel expone, Next.js consume
**Multi-tenancy**: Multi-sucursal — `sucursal_id` presente en todos los modelos con datos operativos (inventario, ventas, pedidos). Las sucursales pertenecen a una `Farmacia` raíz.
**Env**: Separados por capa — `Frontend/.env.local` | `Backend/.env` | servicios extra: su propio `.env`
**Scaffolding**: Siempre por CLI cuando exista comando (`create-next-app`, `composer create-project`, `shadcn add`) — no crear estructura a mano si hay comando
**Deploy semi-producción**: Windows 10 + Cloudflare Tunnel (Argo) con dominio — migración a cloud en producción real

Relaciones: [[stack]] [[git]] [[farmacia]]

## Frontend — Estructura de rutas y componentes
### Route groups (Next.js App Router)

- `app/(public)/` — páginas visibles a usuarios no autenticados (home, tutorial, about, login). Layout aplica `HeaderPublic`.
- `app/(private)/` — páginas del sistema interno tras autenticación (dashboard, inventario, POS, pedidos, reportes). Layout aplica `HeaderPrivate`.
- Los paréntesis hacen que el segmento **no aparezca en la URL** pero permite layouts independientes.
- Cualquier protección de auth se aplicará en `app/(private)/layout.tsx` (redirect a `/login` si no autenticado) cuando se implemente el backend.

### Convención de carpetas `components/`

| Carpeta | Contenido | Capa |
|---------|-----------|------|
| `components/ui/` | Primitives shadcn — no se editan salvo necesidad |  H4 |
| `components/layout/` | Estructura: `header-*`, `aside-*`, `logo`, futuros `footer` | H4 |
| `components/custom/` | Componentes propios genéricos: `theme-provider`, `dark-light-toggle` | H4 |
| `components/<feature>/` (futuro) | Composiciones específicas de un módulo de negocio | H5 |

### Header / Aside dual (responsive) — uno por rol

- **Header** (desktop ≥ 768px): logo + nav + cluster derecho (perfil / logout / theme)
- **Aside** (mobile < 768px): mismo contenido vertical, dentro de `Sheet` activado por hamburguesa
- **Breakpoint**: Tailwind `md` (768px)
- **Un par header/aside por rol**:
  - `header-public.tsx` + `aside-public.tsx` — invitado
  - `header-admin.tsx` + `aside-admin.tsx` — administrador
  - `header-empleado.tsx` + `aside-empleado.tsx` — empleado
  - `header-cliente.tsx` + `aside-cliente.tsx` — cliente
- Chrome común factorizado en `header-shell.tsx` y `aside-shell.tsx` (sticky, container, active-state, mobile sheet). Cada par por rol solo aporta `navLinks` y el cluster derecho.

### Arquitectura de UI por rol (RBAC)

Detalle completo en [[rbac]]. Resumen:

- **Prefijo URL por rol**: `/admin/*`, `/empleado/*`, `/cliente/*` — cada uno con su propio árbol bajo `app/(private)/`.
- **Defensa en profundidad**: backend Policies → `middleware.ts` edge → `<RequireRole>` layout → permission map (`lib/permissions/`).
- **Permission map central**: `PERMISSIONS_BY_ROLE` en `Frontend/lib/permissions/index.ts`. Las UI usan `usePermissions().can(perm)` o `<RoleGate>`, nunca comparan rol crudamente.
- **Cookies de routing**: `auth_token` + `auth_role` seteadas por `use-auth.tsx`. Para enrutamiento, NO para seguridad (el backend sigue siendo la autoridad).

### Theme provider

- `components/custom/theme-provider.tsx` envuelve `<NextThemesProvider>` y se instancia una sola vez en `app/layout.tsx`
- Estrategia: clase `.dark` en `<html>` (`attribute="class"`)
- `defaultTheme="system"`, respeta preferencias del SO
- Toggle dinámico en `components/custom/dark-light-toggle.tsx` — muestra `Moon` en claro y `Sun` en oscuro

## Aviso — detalle por módulo movido a [[frontend-modules]]
El detalle de cada módulo de UI (dashboard, POS, catálogo, inventario, reportes, pedidos del cliente, etc.) **NO va más en esta nota**. Pertenece a [[frontend-modules]], sección 'Detalle por módulo', donde cada feature ocupa una subsección `### Módulo: <rol> / <feature>`. Esta nota mantiene solo decisiones arquitectónicas transversales (route groups, convención de carpetas a alto nivel, header/aside per rol, theme provider). La sección 'Módulo implementado — Admin Dashboard (2026-05-13)' previa quedó como artefacto histórico — se puede borrar a mano para limpiar.
