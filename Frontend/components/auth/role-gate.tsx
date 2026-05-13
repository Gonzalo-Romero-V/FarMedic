"use client"

import { usePermissions } from "@/hooks/use-permissions"
import type { Permission, Role } from "@/lib/permissions"

type Props = {
  /** Rol(es) permitidos. Si se pasa esto, basta con matchear uno. */
  role?: Role | Role[]
  /** Permiso(s) requeridos. Si se pasa, deben cumplirse TODOS. */
  permission?: Permission | Permission[]
  /** Si se cumple, renderiza children. */
  children: React.ReactNode
  /** Render alternativo cuando no se cumple (por default: null). */
  fallback?: React.ReactNode
}

/**
 * Oculta UI según rol o permisos. **No es seguridad** — solo UX.
 *
 * Ejemplos:
 *   <RoleGate role="administrador">…</RoleGate>
 *   <RoleGate permission="kardex.read.global">…</RoleGate>
 *   <RoleGate permission={["pos.sell", "stock.read.local"]}>…</RoleGate>
 */
export function RoleGate({ role, permission, children, fallback = null }: Props) {
  const { role: current, canAll } = usePermissions()

  if (role) {
    const allowed = Array.isArray(role) ? role : [role]
    if (!allowed.includes(current as Role)) return <>{fallback}</>
  }

  if (permission) {
    const perms = Array.isArray(permission) ? permission : [permission]
    if (!canAll(perms)) return <>{fallback}</>
  }

  return <>{children}</>
}
