"use client"

import { useEffect, useState } from "react"

import { ApiError, apiFetch } from "@/lib/api"

import type { AuditoriaEvento } from "./auditoria-reciente-card"
import type { LotePorVencerItem } from "./lotes-por-vencer-card"
import type { PedidoEstadoAbierto, PedidoPendiente } from "./pedidos-pendientes-card"
import type { StockCriticoItem } from "./stock-critico-card"

/**
 * Shape canónico que consume el dashboard (camelCase). La API responde snake_case
 * (convención Laravel) y se mapea acá en el boundary.
 */
export type AdminDashboardData = {
  kpis: {
    ventasDelDia: number
    stockCriticoCount: number
    lotesPorVencerCount: number
    pedidosPendientesCount: number
  }
  stockCritico: StockCriticoItem[]
  lotesPorVencer: LotePorVencerItem[]
  pedidosPendientes: PedidoPendiente[]
  auditoriaReciente: AuditoriaEvento[]
}

/** Shape exacto del payload del backend (snake_case). */
type ApiPayload = {
  kpis: {
    ventas_del_dia: number
    stock_critico_count: number
    lotes_por_vencer_count: number
    pedidos_pendientes_count: number
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
  pedidos_pendientes: ReadonlyArray<{
    id: string
    codigo: string
    cliente: string
    fecha: string
    total: number
    estado: PedidoEstadoAbierto
  }>
  auditoria_reciente: ReadonlyArray<{
    id: string
    actor: string
    accion: string
    entidad: string
    fecha: string
  }>
}

function adapt(payload: ApiPayload): AdminDashboardData {
  return {
    kpis: {
      ventasDelDia: payload.kpis.ventas_del_dia,
      stockCriticoCount: payload.kpis.stock_critico_count,
      lotesPorVencerCount: payload.kpis.lotes_por_vencer_count,
      pedidosPendientesCount: payload.kpis.pedidos_pendientes_count,
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
    pedidosPendientes: payload.pedidos_pendientes.map((it) => ({
      id: it.id,
      codigo: it.codigo,
      cliente: it.cliente,
      fecha: it.fecha,
      total: it.total,
      estado: it.estado,
    })),
    auditoriaReciente: payload.auditoria_reciente.map((it) => ({ ...it })),
  }
}

type State =
  | { status: "loading" }
  | { status: "ready"; data: AdminDashboardData }
  | { status: "error"; error: string }

export function useAdminDashboard(): State {
  const [state, setState] = useState<State>({ status: "loading" })

  useEffect(() => {
    const ctrl = new AbortController()
    apiFetch<ApiPayload>("/admin/dashboard", { signal: ctrl.signal })
      .then((payload) => setState({ status: "ready", data: adapt(payload) }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        const message =
          err instanceof ApiError
            ? `Error ${err.status} al cargar dashboard`
            : err instanceof Error
              ? err.message
              : "Error desconocido al cargar dashboard"
        setState({ status: "error", error: message })
      })
    return () => ctrl.abort()
  }, [])

  return state
}
