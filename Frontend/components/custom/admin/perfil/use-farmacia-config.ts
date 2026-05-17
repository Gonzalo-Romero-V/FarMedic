"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { ApiError, apiFetch } from "@/lib/api"

export type FarmaciaConfig = {
  id: number
  nombre: string
  ruc: string
  iva_tasa: string | number
  telefono_contacto: string
  email_contacto: string
  logo_url: string | null
}

export type FarmaciaUpdateInput = {
  nombre?: string
  ruc?: string
  iva_tasa?: number
  telefono_contacto?: string
  email_contacto?: string
}

type State =
  | { status: "loading" }
  | { status: "ready"; data: FarmaciaConfig }
  | { status: "error"; error: string }

function extractMsg(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const payload = err.payload as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined
    const first = payload?.errors ? Object.values(payload.errors)[0]?.[0] : undefined
    return first ?? payload?.message ?? `Error ${err.status}: ${fallback}`
  }
  if (err instanceof Error) return err.message
  return fallback
}

/**
 * Hook para la configuración global del sistema (singleton Farmacia).
 * El backend mantiene la entidad en `farmacias` por separación de modelo, pero
 * en MVP hay una sola fila (ver [[farmacia]]). La UI lo trata como una config
 * global única.
 */
export function useFarmaciaConfig() {
  const [state, setState] = useState<State>({ status: "loading" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const ctrl = new AbortController()
    apiFetch<FarmaciaConfig>("/farmacia", { signal: ctrl.signal })
      .then((data) => setState({ status: "ready", data }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        setState({ status: "error", error: extractMsg(err, "No se pudo cargar la configuración") })
      })
    return () => ctrl.abort()
  }, [])

  const update = useCallback(
    async (input: FarmaciaUpdateInput, currentId: number) => {
      setSaving(true)
      try {
        const updated = await apiFetch<FarmaciaConfig>(`/farmacia/${currentId}`, {
          method: "PUT",
          body: input,
        })
        setState({ status: "ready", data: updated })
        toast.success("Configuración actualizada")
        return updated
      } catch (err: unknown) {
        toast.error(extractMsg(err, "No se pudo guardar"))
        throw err
      } finally {
        setSaving(false)
      }
    },
    [],
  )

  return { state, saving, update }
}
