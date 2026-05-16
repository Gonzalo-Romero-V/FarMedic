"use client"

import { useCallback, useEffect, useState } from "react"

import { ApiError, apiFetch } from "@/lib/api"

export type MovimientoTipoBackend =
  | "ingreso"
  | "venta"
  | "devolucion_cliente"
  | "devolucion_proveedor"
  | "ajuste"
  | "vencimiento"
  | "perdida"

export type MovimientoRow = {
  id: number
  lote_id: number
  sucursal_id: number
  usuario_id: number | null
  tipo: MovimientoTipoBackend
  cantidad: number
  referencia_tipo: string | null
  referencia_id: number | null
  justificacion: string | null
  created_at: string
  lote?: {
    id: number
    numero_lote: string
    medicamento?: { id: number; nombre_comercial: string }
  }
  usuario?: { id: number; nombre: string } | null
}

export type KardexFilters = {
  page: number
  perPage: number
  tipo?: MovimientoTipoBackend
  loteId?: number
}

export type KardexPaginated = {
  data: MovimientoRow[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

type State =
  | { status: "loading" }
  | { status: "ready"; data: KardexPaginated }
  | { status: "error"; error: string }

function buildQuery(filters: KardexFilters, sucursalId: number): string {
  const p = new URLSearchParams()
  p.set("page", String(filters.page))
  p.set("per_page", String(filters.perPage))
  p.set("sucursal_id", String(sucursalId))
  if (filters.tipo) p.set("tipo", filters.tipo)
  if (filters.loteId) p.set("lote_id", String(filters.loteId))
  return p.toString()
}

export function useStockKardex(
  filters: KardexFilters,
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
    apiFetch<KardexPaginated>(`/movimientos-stock?${buildQuery(filters, sucursalId)}`, {
      signal: ctrl.signal,
    })
      .then((data) => setState({ status: "ready", data }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        const msg =
          err instanceof ApiError
            ? ((err.payload as { message?: string } | undefined)?.message ??
              `Error ${err.status} al cargar kardex`)
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

/**
 * Tipos permitidos al empleado vía POST /api/movimientos-stock. NO incluye
 * `ajuste` — esa operación queda reservada al admin (rbac.md: stock.adjust).
 */
export type MovimientoTipoEmpleado = Extract<
  MovimientoTipoBackend,
  "devolucion_cliente" | "devolucion_proveedor" | "vencimiento" | "perdida"
>

export type MovimientoCreateInput = {
  lote_id: number
  usuario_id: number
  tipo: MovimientoTipoEmpleado
  cantidad: number
  justificacion?: string
}

export async function createMovimiento(input: MovimientoCreateInput): Promise<MovimientoRow> {
  return apiFetch<MovimientoRow>("/movimientos-stock", { method: "POST", body: input })
}

export type LoteLookupRow = {
  id: number
  numero_lote: string
  cantidad_actual: number
  fecha_vencimiento: string
}

export async function fetchLotesDeMedicamento(
  medicamentoId: number,
  sucursalId: number,
): Promise<LoteLookupRow[]> {
  type Paginated = { data: LoteLookupRow[] }
  const payload = await apiFetch<Paginated>(
    `/lotes?medicamento_id=${medicamentoId}&sucursal_id=${sucursalId}&solo_con_stock=1&per_page=100`,
  )
  return payload.data
}
