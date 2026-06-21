import { type Permission, type RoleOrGuest } from "./types"

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

export function can(role: RoleOrGuest | null | undefined, perm: Permission): boolean {
  if (!role) return false
  return PERMISSIONS_BY_ROLE[role]?.includes(perm) ?? false
}

export function canAll(role: RoleOrGuest | null | undefined, perms: Permission[]): boolean {
  return perms.every((p) => can(role, p))
}

export function canAny(role: RoleOrGuest | null | undefined, perms: Permission[]): boolean {
  return perms.some((p) => can(role, p))
}
