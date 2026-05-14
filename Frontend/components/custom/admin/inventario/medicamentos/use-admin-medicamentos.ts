"use client"

import { useEffect, useState } from "react"

import { ApiError, apiFetch } from "@/lib/api"

export type MedicamentoStockRow = {
  id: number
  nombre_comercial: string
  principio_activo: string
  stock_minimo: number
  requiere_receta: boolean
  precio: string | number // Laravel decimal cast
  sucursal_id: number
  sucursal_nombre: string
  categoria_id: number
  categoria_nombre: string
  stock_actual: number
  lotes_vigentes_count: number
  lotes_por_vencer_count: number
  lotes_vencidos_count: number
}

export type MedicamentosFilters = {
  page: number
  perPage: number
  q?: string
  sucursalId?: number
  categoriaId?: number
  soloCritico?: boolean
}

export type MedicamentosPaginated = {
  data: MedicamentoStockRow[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

type State =
  | { status: "loading" }
  | { status: "ready"; data: MedicamentosPaginated }
  | { status: "error"; error: string }

function buildQuery(filters: MedicamentosFilters): string {
  const p = new URLSearchParams()
  p.set("page", String(filters.page))
  p.set("per_page", String(filters.perPage))
  if (filters.q?.trim()) p.set("q", filters.q.trim())
  if (filters.sucursalId) p.set("sucursal_id", String(filters.sucursalId))
  if (filters.categoriaId) p.set("categoria_id", String(filters.categoriaId))
  if (filters.soloCritico) p.set("solo_critico", "1")
  return p.toString()
}

export function useAdminMedicamentos(filters: MedicamentosFilters): State {
  const [state, setState] = useState<State>({ status: "loading" })

  useEffect(() => {
    const ctrl = new AbortController()
    setState({ status: "loading" })
    apiFetch<MedicamentosPaginated>(
      `/admin/inventario/medicamentos?${buildQuery(filters)}`,
      { signal: ctrl.signal },
    )
      .then((data) => setState({ status: "ready", data }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        const msg =
          err instanceof ApiError
            ? `Error ${err.status} al cargar medicamentos`
            : err instanceof Error
              ? err.message
              : "Error desconocido"
        setState({ status: "error", error: msg })
      })
    return () => ctrl.abort()
  }, [filters])

  return state
}
