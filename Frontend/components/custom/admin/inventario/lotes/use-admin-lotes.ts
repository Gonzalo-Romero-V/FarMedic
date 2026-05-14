"use client"

import { useCallback, useEffect, useState } from "react"

import { ApiError, apiFetch } from "@/lib/api"

import type { LoteEstado } from "../_shared/lote-estado-badge"

/** Shape de un lote en `GET /api/lotes` (eager-loaded). */
export type LoteRow = {
  id: number
  numero_lote: string
  fecha_vencimiento: string // ISO YYYY-MM-DD
  fecha_ingreso: string
  cantidad_inicial: number
  cantidad_actual: number
  costo_unitario: string // Laravel decimal cast → string
  medicamento_id: number
  sucursal_id: number
  proveedor_id: number
  medicamento?: {
    id: number
    nombre_comercial: string
    principio_activo: string
    stock_minimo: number
    requiere_receta: boolean
    categoria?: { id: number; nombre: string }
  }
  sucursal?: { id: number; nombre: string; ciudad: string }
  proveedor?: { id: number; nombre: string }
}

export type LotesFilters = {
  page: number
  perPage: number
  q?: string
  sucursalId?: number
  estado?: LoteEstado
  soloConStock?: boolean
}

export type LotesPaginated = {
  data: LoteRow[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

type State =
  | { status: "loading" }
  | { status: "ready"; data: LotesPaginated }
  | { status: "error"; error: string }

function buildQuery(filters: LotesFilters): string {
  const p = new URLSearchParams()
  p.set("page", String(filters.page))
  p.set("per_page", String(filters.perPage))
  if (filters.q?.trim()) p.set("q", filters.q.trim())
  if (filters.sucursalId) p.set("sucursal_id", String(filters.sucursalId))
  if (filters.estado) p.set("estado", filters.estado)
  if (filters.soloConStock) p.set("solo_con_stock", "1")
  return p.toString()
}

export function useAdminLotes(filters: LotesFilters): State & { reload: () => void } {
  const [state, setState] = useState<State>({ status: "loading" })
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    setState({ status: "loading" })
    apiFetch<LotesPaginated>(`/lotes?${buildQuery(filters)}`, { signal: ctrl.signal })
      .then((data) => setState({ status: "ready", data }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        const msg =
          err instanceof ApiError
            ? `Error ${err.status} al cargar lotes`
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

/** Payload aceptado por POST /api/lotes (campos obligatorios del modelo). */
export type LoteCreateInput = {
  medicamento_id: number
  sucursal_id: number
  proveedor_id: number
  numero_lote: string
  fecha_vencimiento: string // YYYY-MM-DD
  fecha_ingreso: string
  cantidad_inicial: number
  costo_unitario: number
  usuario_id?: number
}

/** Payload aceptado por PUT /api/lotes/{id}: solo metadatos. */
export type LoteUpdateInput = {
  numero_lote?: string
  fecha_vencimiento?: string
  costo_unitario?: number
}

export async function createLote(input: LoteCreateInput): Promise<LoteRow> {
  return apiFetch<LoteRow>("/lotes", { method: "POST", body: input })
}

export async function updateLote(id: number, input: LoteUpdateInput): Promise<LoteRow> {
  return apiFetch<LoteRow>(`/lotes/${id}`, { method: "PUT", body: input })
}
