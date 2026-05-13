import { type Role, type RoleOrGuest } from "./index"

/**
 * Mapeo rol → prefijo de URL. Los slugs URL no siempre coinciden 1:1 con
 * `rol.nombre` de la BD (caso: `administrador` → `/admin/`). `/empleado/` y
 * `/cliente/` sí coinciden.
 */
export const ROLE_URL_PREFIX: Record<Role, string> = {
  administrador: "/admin",
  empleado: "/empleado",
  cliente: "/cliente",
}

/** Ruta de aterrizaje tras login por cada rol. */
export const ROLE_HOME: Record<Role, string> = {
  administrador: "/admin/dashboard",
  empleado: "/empleado/dashboard",
  cliente: "/cliente/dashboard",
}

/** Ruta de aterrizaje del invitado (no autenticado). */
export const GUEST_HOME = "/catalogo"

/** Devuelve la home route según el rol del usuario logueado. */
export function homeForRole(role: RoleOrGuest): string {
  if (role === "invitado") return GUEST_HOME
  return ROLE_HOME[role]
}

/** Devuelve el rol cuya home prefija a `pathname`, o null si no matchea. */
export function roleFromPathname(pathname: string): Role | null {
  for (const [role, prefix] of Object.entries(ROLE_URL_PREFIX) as [Role, string][]) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return role
  }
  return null
}
