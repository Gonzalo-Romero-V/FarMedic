"use client"

import { useEffect, useState } from "react"

import { ApiError, apiFetch } from "@/lib/api"

import type { LotePorVencerItem } from "@/components/custom/admin/dashboard/lotes-por-vencer-card"
import type { StockCriticoItem } from "@/components/custom/admin/dashboard/stock-critico-card"

/** Datos canónicos que consume la página de overview de inventario admin. */
export type InventarioOverviewData = {
  kpis: {
    totalMedicamentos: number
    totalLotesActivos: number
    stockCriticoCount: number
    lotesPorVencerCount: number
    lotesVencidosCount: number
    /** null cuando el backend reporta 0 (costos no confiables). */
    valorInventarioUsd: number | null
  }
  stockCritico: StockCriticoItem[]
  lotesPorVencer: LotePorVencerItem[]
}

/** Shape exacto del payload de `GET /api/admin/inventario/overview`. */
type ApiPayload = {
  kpis: {
    total_medicamentos: number
    total_lotes_activos: number
    stock_critico_count: number
    lotes_por_vencer_count: number
    lotes_vencidos_count: number
    valor_inventario_usd: number | null
  }
  stock_critico: ReadonlyArray<{
    id: string
    sucursal: string
    medicamento: string
    stock_actual: number
    stock_minimo: number
  }>
  lotes_por_vencer: ReadonlyArray<{
    id: string
    codigo_lote: string
    medicamento: string
    sucursal: string
    vencimiento: string
    dias_restantes: number
  }>
}

function adapt(payload: ApiPayload): InventarioOverviewData {
  return {
    kpis: {
      totalMedicamentos: payload.kpis.total_medicamentos,
      totalLotesActivos: payload.kpis.total_lotes_activos,
      stockCriticoCount: payload.kpis.stock_critico_count,
      lotesPorVencerCount: payload.kpis.lotes_por_vencer_count,
      lotesVencidosCount: payload.kpis.lotes_vencidos_count,
      valorInventarioUsd: payload.kpis.valor_inventario_usd,
    },
    stockCritico: payload.stock_critico.map((it) => ({
      id: it.id,
      sucursal: it.sucursal,
      medicamento: it.medicamento,
      stockActual: it.stock_actual,
      stockMinimo: it.stock_minimo,
    })),
    lotesPorVencer: payload.lotes_por_vencer.map((it) => ({
      id: it.id,
      codigoLote: it.codigo_lote,
      medicamento: it.medicamento,
      sucursal: it.sucursal,
      vencimiento: it.vencimiento,
      diasRestantes: it.dias_restantes,
    })),
  }
}

type State =
  | { status: "loading" }
  | { status: "ready"; data: InventarioOverviewData }
  | { status: "error"; error: string }

export function useAdminInventarioOverview(): State {
  const [state, setState] = useState<State>({ status: "loading" })

  useEffect(() => {
    const ctrl = new AbortController()
    apiFetch<ApiPayload>("/admin/inventario/overview", { signal: ctrl.signal })
      .then((payload) => setState({ status: "ready", data: adapt(payload) }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        const msg =
          err instanceof ApiError
            ? `Error ${err.status} al cargar overview`
            : err instanceof Error
              ? err.message
              : "Error desconocido"
        setState({ status: "error", error: msg })
      })
    return () => ctrl.abort()
  }, [])

  return state
}
