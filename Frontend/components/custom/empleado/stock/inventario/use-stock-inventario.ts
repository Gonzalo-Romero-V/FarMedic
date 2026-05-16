"use client"

import { useEffect, useState } from "react"

import { ApiError, apiFetch } from "@/lib/api"

export type StockMedicamentoRow = {
  id: number
  nombre_comercial: string
  principio_activo: string
  codigo_barras: string | null
  stock_minimo: number
  ubicacion_fisica: string | null
  requiere_receta: boolean
  precio: string | number
  categoria_id: number
  categoria_nombre: string
  stock_actual: number
  lotes_vigentes_count: number
  lotes_por_vencer_count: number
}

export type StockFilters = {
  page: number
  perPage: number
  q?: string
  categoriaId?: number
  soloCritico?: boolean
}

export type StockPaginated = {
  data: StockMedicamentoRow[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

function buildQuery(f: StockFilters): string {
  const p = new URLSearchParams()
  p.set("page", String(f.page))
  p.set("per_page", String(f.perPage))
  if (f.q?.trim()) p.set("q", f.q.trim())
  if (f.categoriaId) p.set("categoria_id", String(f.categoriaId))
  if (f.soloCritico) p.set("solo_critico", "1")
  return p.toString()
}

type State =
  | { status: "loading" }
  | { status: "ready"; data: StockPaginated }
  | { status: "error"; error: string }

export function useStockInventario(filters: StockFilters): State {
  const [state, setState] = useState<State>({ status: "loading" })

  useEffect(() => {
    const ctrl = new AbortController()
    setState({ status: "loading" })
    apiFetch<StockPaginated>(
      `/empleado/inventario/medicamentos?${buildQuery(filters)}`,
      { signal: ctrl.signal },
    )
      .then((data) => setState({ status: "ready", data }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        const msg =
          err instanceof ApiError
            ? ((err.payload as { message?: string } | undefined)?.message ??
              `Error ${err.status} al cargar medicamentos`)
            : err instanceof Error
              ? err.message
              : "Error desconocido"
        setState({ status: "error", error: msg })
      })
    return () => ctrl.abort()
  }, [filters])

  return state
}
