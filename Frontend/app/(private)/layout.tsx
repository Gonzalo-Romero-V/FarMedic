"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/hooks/use-auth"
import { usePermissions } from "@/hooks/use-permissions"
import { homeForRole } from "@/lib/permissions"

/**
 * Layout privado raíz. **Solo verifica que haya token y que el rol del
 * usuario tenga home válida**. El chrome (header, aside) lo monta cada
 * sub-layout por rol (`admin/layout.tsx`, `empleado/layout.tsx`,
 * `cliente/layout.tsx`).
 *
 * Si el usuario aterriza en `/perfil` u otra ruta privada compartida sin
 * prefijo de rol, este layout no redirige (deja que la página se renderice).
 *
 * El edge middleware ya hizo el guard fuerte antes; esto es defensa en
 * profundidad para el caso de inconsistencias runtime.
 */
export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { token, isLoading: authLoading } = useAuth()
  const { role, isLoading: permsLoading } = usePermissions()
  const isLoading = authLoading || permsLoading

  useEffect(() => {
    if (isLoading) return
    if (!token) router.push("/login")
  }, [isLoading, token, router])

  if (isLoading || !token) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // Por si caen acá los autenticados sin rol válido (no debería pasar).
  if (role === "invitado") {
    router.push(homeForRole(role))
    return null
  }

  return <>{children}</>
}
