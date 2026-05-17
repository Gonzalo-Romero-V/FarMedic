"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/hooks/use-auth"
import { isRole } from "@/lib/permissions"
import { ROLE_URL_PREFIX } from "@/lib/permissions/role-routes"

/**
 * Dispatcher fino: cada rol tiene su propio perfil bajo su chrome (admin,
 * empleado, cliente). Esta página redirige al `<rol>/perfil` correspondiente.
 * Existe para mantener un punto de entrada estable desde headers/asides sin
 * que cada link conozca el prefijo del rol.
 */
export default function PerfilDispatcherPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading || !user) return
    const role = user.rol?.nombre
    if (isRole(role)) {
      router.replace(`${ROLE_URL_PREFIX[role]}/perfil`)
    } else {
      router.replace("/login")
    }
  }, [user, isLoading, router])

  return null
}
