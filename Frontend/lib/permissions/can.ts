import { PERMISSIONS_BY_ROLE, type Permission, type RoleOrGuest } from "./index"

/**
 * Comprueba si un rol tiene un permiso. Usar en componentes y guards.
 * Recordatorio: la decisión real de seguridad la toma el backend; esta
 * función solo controla la visibilidad de UI.
 */
export function can(role: RoleOrGuest | null | undefined, perm: Permission): boolean {
  if (!role) return false
  return PERMISSIONS_BY_ROLE[role]?.includes(perm) ?? false
}

/** Como `can` pero recibe múltiples permisos y devuelve true si tiene TODOS. */
export function canAll(
  role: RoleOrGuest | null | undefined,
  perms: Permission[],
): boolean {
  return perms.every((p) => can(role, p))
}

/** Devuelve true si el rol tiene al menos uno de los permisos pedidos. */
export function canAny(
  role: RoleOrGuest | null | undefined,
  perms: Permission[],
): boolean {
  return perms.some((p) => can(role, p))
}
