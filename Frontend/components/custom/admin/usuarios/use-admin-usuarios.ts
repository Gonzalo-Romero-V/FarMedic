"use client"

import { useCallback, useEffect, useState } from "react"

import { ApiError, apiFetch } from "@/lib/api"

export type RolNombre = "administrador" | "empleado" | "cliente"

export type UsuarioRow = {
  id: number
  rol_id: number
  sucursal_id: number | null
  nombre: string
  email: string
  telefono: string | null
  direccion: string | null
  activo: boolean
  created_at: string
  rol?: { id: number; nombre: RolNombre }
  sucursal?: { id: number; nombre: string; ciudad: string } | null
}

export type UsuariosFilters = {
  q?: string
  rol?: RolNombre
  sucursalId?: number
  soloActivos: boolean
}

type State =
  | { status: "loading" }
  | { status: "ready"; data: UsuarioRow[] }
  | { status: "error"; error: string }

function buildQuery(f: UsuariosFilters): string {
  const p = new URLSearchParams()
  if (!f.soloActivos) p.set("solo_activos", "0")
  if (f.rol) p.set("rol", f.rol)
  if (f.sucursalId) p.set("sucursal_id", String(f.sucursalId))
  return p.toString()
}

export function useAdminUsuarios(
  filters: UsuariosFilters,
): State & { reload: () => void } {
  const [state, setState] = useState<State>({ status: "loading" })
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    setState({ status: "loading" })
    apiFetch<UsuarioRow[]>(`/usuarios?${buildQuery(filters)}`, { signal: ctrl.signal })
      .then((data) => {
        const filtered = filters.q?.trim()
          ? data.filter((u) => {
              const t = filters.q!.toLowerCase()
              return (
                u.nombre.toLowerCase().includes(t) ||
                u.email.toLowerCase().includes(t)
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
              `Error ${err.status} al cargar usuarios`)
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

export type Rol = { id: number; nombre: RolNombre; descripcion: string | null }

export async function fetchRoles(): Promise<Rol[]> {
  return apiFetch<Rol[]>("/roles")
}

export type UsuarioCreateInput = {
  rol_id: number
  sucursal_id: number | null
  nombre: string
  email: string
  password: string
  telefono?: string | null
  direccion?: string | null
}

export type UsuarioUpdateInput = Partial<{
  nombre: string
  email: string
  password: string
  telefono: string | null
  direccion: string | null
  sucursal_id: number | null
  activo: boolean
}>

export async function createUsuario(input: UsuarioCreateInput): Promise<UsuarioRow> {
  return apiFetch<UsuarioRow>("/usuarios", { method: "POST", body: input })
}

export async function updateUsuario(
  id: number,
  input: UsuarioUpdateInput,
): Promise<UsuarioRow> {
  return apiFetch<UsuarioRow>(`/usuarios/${id}`, { method: "PUT", body: input })
}

export async function deleteUsuario(id: number): Promise<void> {
  return apiFetch<void>(`/usuarios/${id}`, { method: "DELETE" })
}

export type CambiarRolInput = { rol_id: number; sucursal_id?: number | null }

export async function cambiarRol(id: number, input: CambiarRolInput): Promise<UsuarioRow> {
  return apiFetch<UsuarioRow>(`/usuarios/${id}/rol`, { method: "PATCH", body: input })
}
