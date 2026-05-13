"use client"

import { useAuth } from "@/hooks/use-auth"
import { can, canAll, canAny } from "@/lib/permissions/can"
import { isRole, type Permission, type Role, type RoleOrGuest } from "@/lib/permissions"

/**
 * Hook de permisos atado al usuario en `AuthContext`. Si no hay usuario,
 * el rol efectivo es `"invitado"`.
 *
 * Uso:
 *   const { role, can, isAdmin } = usePermissions()
 *   if (can("pos.sell")) { ... }
 */
export function usePermissions() {
  const { user, isLoading } = useAuth()
  const rawRole = user?.rol?.nombre ?? null
  const role: RoleOrGuest = isRole(rawRole) ? rawRole : "invitado"

  return {
    role,
    isLoading,
    isAdmin: role === "administrador",
    isEmpleado: role === "empleado",
    isCliente: role === "cliente",
    isGuest: role === "invitado",
    hasRole: (r: Role) => role === r,
    can: (perm: Permission) => can(role, perm),
    canAll: (perms: Permission[]) => canAll(role, perms),
    canAny: (perms: Permission[]) => canAny(role, perms),
  }
}
