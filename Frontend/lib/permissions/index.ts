/**
 * RBAC — single source of truth para la UI.
 *
 * El backend es la autoridad real (auth:sanctum + role: middleware + Policies).
 * Este módulo SOLO controla qué ve cada rol; nunca decide seguridad real.
 *
 * Reglas:
 * - Los slugs `Role` coinciden con `rol.nombre` en la BD (`administrador`, `empleado`, `cliente`).
 * - El "Invitado" no es un rol persistido; representa la ausencia de auth.
 * - `Permission` es granular. Sufijo `.local` = limitado a `sucursal_id` del usuario.
 *   Sufijo `.global` = transversal a todas las sucursales.
 */

export const ROLES = ["administrador", "empleado", "cliente"] as const
export type Role = (typeof ROLES)[number]
export type RoleOrGuest = Role | "invitado"

export const PERMISSIONS = [
  // Catálogo
  "catalog.read",
  "catalog.manage",
  // POS (Punto de venta)
  "pos.sell",
  // Inventario y Kardex
  "stock.read.local",
  "stock.read.global",
  "stock.write.local",
  "stock.write.global",
  "kardex.read.local",
  "kardex.read.global",
  "lotes.manage.local",
  "lotes.manage.global",
  "stock.adjust", // ajuste manual — siempre admin
  // Pedidos
  "orders.create",
  "orders.read.own",
  "orders.read.all",
  "orders.manage",
  // Devoluciones
  "returns.create.local",
  // Usuarios y sucursales
  "users.manage",
  "sucursales.manage",
  // Reportes y auditoría
  "reports.view",
  "audit.view",
  // Perfil propio
  "profile.edit.own",
] as const

export type Permission = (typeof PERMISSIONS)[number]

const ADMIN_PERMISSIONS: Permission[] = [
  "catalog.read",
  "catalog.manage",
  "stock.read.global",
  "stock.write.global",
  "kardex.read.global",
  "lotes.manage.global",
  "stock.adjust",
  "orders.read.all",
  "orders.manage",
  "users.manage",
  "sucursales.manage",
  "reports.view",
  "audit.view",
  "profile.edit.own",
]

const EMPLEADO_PERMISSIONS: Permission[] = [
  "catalog.read",
  "pos.sell",
  "stock.read.local",
  "stock.write.local",
  "kardex.read.local",
  "lotes.manage.local",
  "returns.create.local",
  "orders.read.all",
  "orders.manage",
  "profile.edit.own",
]

const CLIENTE_PERMISSIONS: Permission[] = [
  "catalog.read",
  "orders.create",
  "orders.read.own",
  "profile.edit.own",
]

const INVITADO_PERMISSIONS: Permission[] = ["catalog.read"]

export const PERMISSIONS_BY_ROLE: Record<RoleOrGuest, readonly Permission[]> = {
  administrador: ADMIN_PERMISSIONS,
  empleado: EMPLEADO_PERMISSIONS,
  cliente: CLIENTE_PERMISSIONS,
  invitado: INVITADO_PERMISSIONS,
}

export function isRole(value: string | null | undefined): value is Role {
  return value === "administrador" || value === "empleado" || value === "cliente"
}

// Re-exports — `@/lib/permissions` es el barrel público del módulo.
export {
  ROLE_URL_PREFIX,
  ROLE_HOME,
  GUEST_HOME,
  homeForRole,
  roleFromPathname,
} from "./role-routes"
export { can, canAll, canAny } from "./can"
