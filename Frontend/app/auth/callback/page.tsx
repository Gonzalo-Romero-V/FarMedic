"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { homeForRole, isRole } from "@/lib/permissions"

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()

  useEffect(() => {
    const token = searchParams.get("token")
    const error = searchParams.get("error")

    if (error) {
      const messages: Record<string, string> = {
        oauth_failed: "Error al autenticar con Google",
        usuario_inactivo: "Usuario inactivo",
        internal_error: "Error interno en el servidor",
      }
      toast.error(messages[error] || "Ocurrió un error inesperado")
      router.push("/login")
      return
    }

    if (token) {
      const fetchUser = async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          })

          if (!response.ok) throw new Error("No se pudo obtener el usuario")

          const user = await response.json()
          login(token, user)
          const roleName = user?.rol?.nombre
          router.push(isRole(roleName) ? homeForRole(roleName) : "/")
        } catch (err) {
          console.error(err)
          toast.error("Error al completar el inicio de sesión")
          router.push("/login")
        }
      }

      fetchUser()
    } else {
      router.push("/login")
    }
  }, [searchParams, login, router])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="text-lg font-medium animate-pulse">Autenticando...</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-lg font-medium animate-pulse">Cargando...</p>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}
