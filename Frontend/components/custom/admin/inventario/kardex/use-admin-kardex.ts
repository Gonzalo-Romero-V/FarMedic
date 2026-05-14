"use client"

import { useCallback, useEffect, useState } from "react"

import { ApiError, apiFetch } from "@/lib/api"

/**
 * Tipo backend canónico ([[movimiento-stock]] vault).
 * Los manuales aceptados por POST /api/movimientos-stock son:
 *   ajuste | devolucion_cliente | devolucion_proveedor | vencimiento | perdida
 * Los auto-generados (`ingreso`, `venta`) aparecen en kardex pero no se crean acá.
 */
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
  sucursalId?: number
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

function buildQuery(filters: KardexFilters): string {
  const p = new URLSearchParams()
  p.set("page", String(filters.page))
  p.set("per_page", String(filters.perPage))
  if (filters.tipo) p.set("tipo", filters.tipo)
  if (filters.sucursalId) p.set("sucursal_id", String(filters.sucursalId))
  if (filters.loteId) p.set("lote_id", String(filters.loteId))
  return p.toString()
}

export function useAdminKardex(filters: KardexFilters): State & { reload: () => void } {
  const [state, setState] = useState<State>({ status: "loading" })
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    setState({ status: "loading" })
    apiFetch<KardexPaginated>(`/movimientos-stock?${buildQuery(filters)}`, { signal: ctrl.signal })
      .then((data) => setState({ status: "ready", data }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        const msg =
          err instanceof ApiError
            ? `Error ${err.status} al cargar kardex`
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

/** Payload aceptado por POST /api/movimientos-stock. */
export type MovimientoCreateInput = {
  lote_id: number
  usuario_id: number
  tipo: Extract<
    MovimientoTipoBackend,
    "ajuste" | "devolucion_cliente" | "devolucion_proveedor" | "vencimiento" | "perdida"
  >
  cantidad: number // signed
  justificacion?: string
}

export async function createMovimiento(input: MovimientoCreateInput): Promise<MovimientoRow> {
  return apiFetch<MovimientoRow>("/movimientos-stock", { method: "POST", body: input })
}

/**
 * Subset de lotes que devuelve `/api/lotes?medicamento_id=X` cuando lo usamos
 * como "lookup secundario" del Dialog de alta de movimiento.
 */
export type LoteLookupRow = {
  id: number
  numero_lote: string
  cantidad_actual: number
  fecha_vencimiento: string
}

export async function fetchLotesDeMedicamento(medicamentoId: number): Promise<LoteLookupRow[]> {
  type Paginated = { data: LoteLookupRow[] }
  const payload = await apiFetch<Paginated>(
    `/lotes?medicamento_id=${medicamentoId}&solo_con_stock=1&per_page=100`,
  )
  return payload.data
}
