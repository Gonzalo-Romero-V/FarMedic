"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { usePermissions } from "@/hooks/use-permissions"
import { PagePlaceholder } from "@/components/custom/page-placeholder"

/**
 * Perfil compartido para admin/empleado. Para el cliente, redirige a
 * `/cliente/perfil` (que tiene chrome de cliente).
 */
export default function PerfilPage() {
  const router = useRouter()
  const { isCliente, isLoading } = usePermissions()

  useEffect(() => {
    if (!isLoading && isCliente) router.push("/cliente/perfil")
  }, [isCliente, isLoading, router])

  if (isLoading || isCliente) return null

  return (
    <PagePlaceholder
      title="Mi perfil"
      subtitle="Datos personales y de contacto."
      todos={["Nombre, email", "Sucursal asignada (empleado/admin)", "Cambio de contraseña"]}
    />
  )
}
