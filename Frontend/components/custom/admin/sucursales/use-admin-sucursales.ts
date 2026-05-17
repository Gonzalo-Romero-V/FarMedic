"use client"

import { useCallback, useEffect, useState } from "react"

import { ApiError, apiFetch } from "@/lib/api"

export type SucursalRow = {
  id: number
  farmacia_id: number
  nombre: string
  ciudad: string
  direccion: string
  latitud: string | number | null
  longitud: string | number | null
  telefono: string
  activa: boolean
  farmacia?: { id: number; nombre: string }
}

export type SucursalesFilters = {
  q?: string
  ciudad?: string
  soloActivas: boolean
}

type State =
  | { status: "loading" }
  | { status: "ready"; data: SucursalRow[] }
  | { status: "error"; error: string }

function buildQuery(filters: SucursalesFilters): string {
  const p = new URLSearchParams()
  if (!filters.soloActivas) p.set("solo_activas", "0")
  if (filters.ciudad) p.set("ciudad", filters.ciudad)
  return p.toString()
}

export function useAdminSucursales(
  filters: SucursalesFilters,
): State & { reload: () => void } {
  const [state, setState] = useState<State>({ status: "loading" })
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    setState({ status: "loading" })
    apiFetch<SucursalRow[]>(`/sucursales?${buildQuery(filters)}`, { signal: ctrl.signal })
      .then((data) => {
        const filtered = filters.q?.trim()
          ? data.filter((s) => {
              const term = filters.q!.toLowerCase()
              return (
                s.nombre.toLowerCase().includes(term) ||
                s.ciudad.toLowerCase().includes(term) ||
                s.direccion.toLowerCase().includes(term)
              )
            })
          : data
        setState({ status: "ready", data: filtered })
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        const msg =
          err instanceof ApiError
            ? ((err.payload as { message?: string } | undefined)?.message ??
              `Error ${err.status} al cargar sucursales`)
            : err instanceof Error
              ? err.message
              : "Error desconocido"
        setState({ status: "error", error: msg })
      })
    return () => ctrl.abort()
  }, [filters, reloadToken])

  const reload = useCallback(() => setReloadToken((t) => t + 1), [])
  return { ...state, reload }
}

export type SucursalCreateInput = {
  farmacia_id: number
  nombre: string
  ciudad: string
  direccion: string
  latitud: number | null
  longitud: number | null
  telefono: string
  activa: boolean
}

export type SucursalUpdateInput = Partial<SucursalCreateInput>

export async function createSucursal(input: SucursalCreateInput): Promise<SucursalRow> {
  return apiFetch<SucursalRow>("/sucursales", { method: "POST", body: input })
}

export async function updateSucursal(
  id: number,
  input: SucursalUpdateInput,
): Promise<SucursalRow> {
  return apiFetch<SucursalRow>(`/sucursales/${id}`, { method: "PUT", body: input })
}

export async function deleteSucursal(id: number): Promise<void> {
  return apiFetch<void>(`/sucursales/${id}`, { method: "DELETE" })
}

export async function fetchFarmacia(): Promise<{ id: number; nombre: string }> {
  return apiFetch<{ id: number; nombre: string }>("/farmacia")
}
