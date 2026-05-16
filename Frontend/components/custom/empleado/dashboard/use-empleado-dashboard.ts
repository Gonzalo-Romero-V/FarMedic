"use client"

import { useEffect, useState } from "react"

import type { LotePorVencerItem } from "@/components/custom/admin/dashboard/lotes-por-vencer-card"
import type { PedidoEstadoAbierto, PedidoPendiente } from "@/components/custom/admin/dashboard/pedidos-pendientes-card"
import type { StockCriticoItem } from "@/components/custom/admin/dashboard/stock-critico-card"
import { ApiError, apiFetch } from "@/lib/api"

export type VentaRecienteItem = {
  id: string
  numeroComprobante: string
  cliente: string
  fecha: string
  total: number
  estado: "completada" | "anulada"
  metodoPago: "efectivo" | "tarjeta" | "transferencia"
}

export type EmpleadoDashboardData = {
  kpis: {
    ventasDelDia: number
    ventasCountDia: number
    stockCriticoCount: number
    lotesPorVencerCount: number
    pedidosPendientesCount: number
  }
  stockCritico: StockCriticoItem[]
  lotesPorVencer: LotePorVencerItem[]
  ventasRecientes: VentaRecienteItem[]
  pedidosPendientes: PedidoPendiente[]
}

type ApiPayload = {
  kpis: {
    ventas_del_dia: number
    ventas_count_dia: number
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
  ventas_recientes: ReadonlyArray<{
    id: string
    numero_comprobante: string
    cliente: string
    fecha: string
    total: number
    estado: "completada" | "anulada"
    metodo_pago: "efectivo" | "tarjeta" | "transferencia"
  }>
  pedidos_pendientes: ReadonlyArray<{
    id: string
    codigo: string
    cliente: string
    fecha: string
    total: number
    estado: PedidoEstadoAbierto
  }>
}

function adapt(payload: ApiPayload): EmpleadoDashboardData {
  return {
    kpis: {
      ventasDelDia: payload.kpis.ventas_del_dia,
      ventasCountDia: payload.kpis.ventas_count_dia,
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
    ventasRecientes: payload.ventas_recientes.map((it) => ({
      id: it.id,
      numeroComprobante: it.numero_comprobante,
      cliente: it.cliente,
      fecha: it.fecha,
      total: it.total,
      estado: it.estado,
      metodoPago: it.metodo_pago,
    })),
    pedidosPendientes: payload.pedidos_pendientes.map((it) => ({
      id: it.id,
      codigo: it.codigo,
      cliente: it.cliente,
      fecha: it.fecha,
      total: it.total,
      estado: it.estado,
    })),
  }
}

type State =
  | { status: "loading" }
  | { status: "ready"; data: EmpleadoDashboardData }
  | { status: "error"; error: string }

export function useEmpleadoDashboard(): State {
  const [state, setState] = useState<State>({ status: "loading" })

  useEffect(() => {
    const ctrl = new AbortController()
    apiFetch<ApiPayload>("/empleado/dashboard", { signal: ctrl.signal })
      .then((payload) => setState({ status: "ready", data: adapt(payload) }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        const message =
          err instanceof ApiError
            ? ((err.payload as { message?: string } | undefined)?.message ??
              `Error ${err.status} al cargar dashboard`)
            : err instanceof Error
              ? err.message
              : "Error desconocido al cargar dashboard"
        setState({ status: "error", error: message })
      })
    return () => ctrl.abort()
  }, [])

  return state
}
