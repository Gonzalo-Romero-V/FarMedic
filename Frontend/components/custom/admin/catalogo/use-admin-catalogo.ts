"use client"

import { useCallback, useEffect, useState } from "react"

import { ApiError, apiFetch } from "@/lib/api"

/** Shape de un medicamento en GET /api/medicamentos (eager-load categoria + proveedor). */
export type MedicamentoRow = {
  id: number
  sucursal_id: number
  categoria_id: number
  proveedor_id: number
  nombre_comercial: string
  principio_activo: string
  codigo_barras: string | null
  precio: string // Laravel decimal cast
  stock_minimo: number
  ubicacion_fisica: string
  requiere_receta: boolean
  activo: boolean
  categoria?: { id: number; nombre: string }
  proveedor?: { id: number; nombre: string }
}

export type CatalogoFilters = {
  page: number
  perPage: number
  q?: string
  sucursalId?: number
  categoriaId?: number
  soloActivos?: boolean
}

export type CatalogoPaginated = {
  data: MedicamentoRow[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

type State =
  | { status: "loading" }
  | { status: "ready"; data: CatalogoPaginated }
  | { status: "error"; error: string }

function buildQuery(filters: CatalogoFilters): string {
  const p = new URLSearchParams()
  p.set("page", String(filters.page))
  p.set("per_page", String(filters.perPage))
  if (filters.q?.trim()) p.set("q", filters.q.trim())
  if (filters.sucursalId) p.set("sucursal_id", String(filters.sucursalId))
  if (filters.categoriaId) p.set("categoria_id", String(filters.categoriaId))
  // El backend toma `solo_activos` con default true. Solo lo enviamos cuando queremos
  // explícitamente incluir inactivos (`solo_activos=0`).
  if (filters.soloActivos === false) p.set("solo_activos", "0")
  return p.toString()
}

export function useAdminCatalogo(filters: CatalogoFilters): State & { reload: () => void } {
  const [state, setState] = useState<State>({ status: "loading" })
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    setState({ status: "loading" })
    apiFetch<CatalogoPaginated>(`/medicamentos?${buildQuery(filters)}`, { signal: ctrl.signal })
      .then((data) => setState({ status: "ready", data }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        const msg =
          err instanceof ApiError
            ? `Error ${err.status} al cargar catálogo`
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

/** Payload aceptado por POST /api/medicamentos (todos los campos del modelo). */
export type MedicamentoCreateInput = {
  sucursal_id: number
  categoria_id: number
  proveedor_id: number
  nombre_comercial: string
  principio_activo: string
  codigo_barras?: string | null
  precio: number
  stock_minimo: number
  ubicacion_fisica: string
  requiere_receta: boolean
  activo: boolean
}

/** Payload aceptado por PUT /api/medicamentos/{id} (parcial, todos opcionales). */
export type MedicamentoUpdateInput = Partial<MedicamentoCreateInput>

export async function createMedicamento(input: MedicamentoCreateInput): Promise<MedicamentoRow> {
  return apiFetch<MedicamentoRow>("/medicamentos", { method: "POST", body: input })
}

export async function updateMedicamento(
  id: number,
  input: MedicamentoUpdateInput,
): Promise<MedicamentoRow> {
  return apiFetch<MedicamentoRow>(`/medicamentos/${id}`, { method: "PUT", body: input })
}

/** Soft delete (deleted_at) — el registro queda en BD para historial de ventas. */
export async function deleteMedicamento(id: number): Promise<void> {
  await apiFetch<void>(`/medicamentos/${id}`, { method: "DELETE" })
}
