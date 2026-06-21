import { type Role, type RoleOrGuest } from "./types"

export function isRole(value: string | null | undefined): value is Role {
  return value === "administrador" || value === "empleado" || value === "cliente"
}

export const ROLE_URL_PREFIX: Record<Role, string> = {
  administrador: "/admin",
  empleado: "/empleado",
  cliente: "/cliente",
}

export const ROLE_HOME: Record<Role, string> = {
  administrador: "/admin/dashboard",
  empleado: "/empleado/dashboard",
  cliente: "/cliente/dashboard",
}

export const GUEST_HOME = "/catalogo"

export function homeForRole(role: RoleOrGuest): string {
  if (role === "invitado") return GUEST_HOME
  return ROLE_HOME[role]
}

export function roleFromPathname(pathname: string): Role | null {
  for (const [role, prefix] of Object.entries(ROLE_URL_PREFIX) as [Role, string][]) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return role
  }
  return null
}
