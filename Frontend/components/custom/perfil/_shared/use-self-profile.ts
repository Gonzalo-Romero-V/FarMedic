"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"

import { useAuth } from "@/hooks/use-auth"
import { ApiError, apiFetch } from "@/lib/api"

export type UpdateProfileInput = {
  nombre?: string
  telefono?: string | null
  direccion?: string | null
}

export type UpdatePasswordInput = {
  password_actual: string
  password_nueva: string
}

type UserResponse = {
  id: number
  nombre: string
  email: string
  rol: { id: number; nombre: string }
  sucursal_id: number | null
  sucursal?: { id: number; nombre: string; ciudad?: string; direccion?: string } | null
  telefono?: string | null
  direccion?: string | null
  google_oauth_id?: string | null
  created_at?: string | null
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const payload = err.payload as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined
    const firstField = payload?.errors ? Object.values(payload.errors)[0]?.[0] : undefined
    return firstField ?? payload?.message ?? `Error ${err.status}: ${fallback}`
  }
  if (err instanceof Error) return err.message
  return fallback
}

/**
 * Mutaciones self-edit del perfil. Compartido entre los tres roles porque
 * los endpoints `auth/me` son agnósticos al rol (el backend aplica la
 * whitelist según rol). Cada isla cliente lo orquesta a su gusto.
 */
export function useSelfProfile() {
  const { user, setUser } = useAuth()
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const updateProfile = useCallback(
    async (input: UpdateProfileInput) => {
      setSavingProfile(true)
      try {
        const updated = await apiFetch<UserResponse>("/auth/me", {
          method: "PUT",
          body: input,
        })
        setUser(updated as Parameters<typeof setUser>[0])
        toast.success("Perfil actualizado")
        return updated
      } catch (err: unknown) {
        toast.error(extractErrorMessage(err, "No se pudo actualizar"))
        throw err
      } finally {
        setSavingProfile(false)
      }
    },
    [setUser],
  )

  const updatePassword = useCallback(async (input: UpdatePasswordInput) => {
    setSavingPassword(true)
    try {
      await apiFetch("/auth/me/password", { method: "POST", body: input })
      toast.success("Contraseña actualizada. Se cerraron las otras sesiones.")
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, "No se pudo cambiar la contraseña"))
      throw err
    } finally {
      setSavingPassword(false)
    }
  }, [])

  return { user, updateProfile, updatePassword, savingProfile, savingPassword }
}
