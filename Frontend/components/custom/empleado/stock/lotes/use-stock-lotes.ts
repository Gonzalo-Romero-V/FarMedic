"use client"

import { useCallback, useEffect, useState } from "react"

import { ApiError, apiFetch } from "@/lib/api"

import type { LoteEstado } from "@/components/custom/admin/inventario/_shared/lote-estado-badge"

export type LoteRow = {
  id: number
  numero_lote: string
  fecha_vencimiento: string
  fecha_ingreso: string
  cantidad_inicial: number
  cantidad_actual: number
  costo_unitario: string
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
  sucursal?: { id: number; nombre: string }
  proveedor?: { id: number; nombre: string }
}

export type LotesFilters = {
  page: number
  perPage: number
  q?: string
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

function buildQuery(f: LotesFilters, sucursalId: number): string {
  const p = new URLSearchParams()
  p.set("page", String(f.page))
  p.set("per_page", String(f.perPage))
  p.set("sucursal_id", String(sucursalId))
  if (f.q?.trim()) p.set("q", f.q.trim())
  if (f.estado) p.set("estado", f.estado)
  if (f.soloConStock) p.set("solo_con_stock", "1")
  return p.toString()
}

/**
 * Reusa `GET /api/lotes` pero forzando `sucursal_id` del empleado autenticado
 * para mantener el alcance local sin mezclar lotes de otras sucursales.
 */
export function useStockLotes(
  filters: LotesFilters,
  sucursalId: number | null,
): State & { reload: () => void } {
  const [state, setState] = useState<State>({ status: "loading" })
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (sucursalId === null) {
      setState({ status: "error", error: "Usuario sin sucursal asignada" })
      return
    }
    const ctrl = new AbortController()
    setState({ status: "loading" })
    apiFetch<LotesPaginated>(`/lotes?${buildQuery(filters, sucursalId)}`, {
      signal: ctrl.signal,
    })
      .then((data) => setState({ status: "ready", data }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        const msg =
          err instanceof ApiError
            ? ((err.payload as { message?: string } | undefined)?.message ??
              `Error ${err.status} al cargar lotes`)
            : err instanceof Error
              ? err.message
              : "Error desconocido"
        setState({ status: "error", error: msg })
      })
    return () => ctrl.abort()
  }, [filters, reloadToken, sucursalId])

  const reload = useCallback(() => setReloadToken((t) => t + 1), [])
  return { ...state, reload }
}

export type LoteCreateInput = {
  medicamento_id: number
  sucursal_id: number
  proveedor_id: number
  numero_lote: string
  fecha_vencimiento: string
  fecha_ingreso: string
  cantidad_inicial: number
  costo_unitario: number
  usuario_id?: number
}

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
