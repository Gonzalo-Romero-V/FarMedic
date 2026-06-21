export const ROLES = ["administrador", "empleado", "cliente"] as const
export type Role = (typeof ROLES)[number]
export type RoleOrGuest = Role | "invitado"

export const PERMISSIONS = [
  "catalog.read",
  "catalog.manage",
  "pos.sell",
  "stock.read.local",
  "stock.read.global",
  "stock.write.local",
  "stock.write.global",
  "kardex.read.local",
  "kardex.read.global",
  "lotes.manage.local",
  "lotes.manage.global",
  "stock.adjust",
  "orders.create",
  "orders.read.own",
  "orders.read.all",
  "orders.manage",
  "returns.create.local",
  "users.manage",
  "sucursales.manage",
  "reports.view",
  "audit.view",
  "profile.edit.own",
] as const

export type Permission = (typeof PERMISSIONS)[number]
