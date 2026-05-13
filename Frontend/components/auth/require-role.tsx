"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/hooks/use-auth"
import { usePermissions } from "@/hooks/use-permissions"
import { homeForRole, type Role } from "@/lib/permissions"

type Props = {
  /** Rol que debe tener el usuario para ver `children`. */
  role: Role
  children: React.ReactNode
}

/**
 * Envuelve un layout de rol. Si el usuario autenticado tiene OTRO rol,
 * lo redirige a su propia home. Si no está autenticado, lo manda a /login.
 *
 * Es la segunda línea de defensa después del middleware edge: el middleware
 * decide ANTES del render; este guard captura cualquier inconsistencia
 * (p. ej. cookie sin localStorage, rol cambiado runtime, etc.) y bloquea
 * el contenido en cliente.
 */
export function RequireRole({ role, children }: Props) {
  const router = useRouter()
  const { token, isLoading: authLoading } = useAuth()
  const { role: current, isLoading: permsLoading } = usePermissions()
  const isLoading = authLoading || permsLoading

  useEffect(() => {
    if (isLoading) return
    if (!token) {
      router.push("/login")
      return
    }
    if (current !== role) {
      router.push(homeForRole(current))
    }
  }, [isLoading, token, current, role, router])

  if (isLoading || !token || current !== role) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return <>{children}</>
}
