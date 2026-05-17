"use client"

import { useEffect, useState } from "react"

import { ApiError, apiFetch } from "@/lib/api"

import type { PedidoEstado } from "../pedidos/use-cliente-pedidos"

export type PedidoRecienteItem = {
  id: number
  numeroPedido: string
  sucursalNombre: string
  estado: PedidoEstado
  tipoEntrega: "retiro_local" | "domicilio"
  total: number
  fechaSolicitud: string
}

export type ClienteDashboardData = {
  kpis: {
    pedidosPendientes: number
    pedidosEnCamino: number
    pedidosEntregados: number
    totalGastado: number
  }
  pedidosRecientes: PedidoRecienteItem[]
}

type ApiPayload = {
  kpis: {
    pedidos_pendientes: number
    pedidos_en_camino: number
    pedidos_entregados: number
    total_gastado: number
  }
  pedidos_recientes: ReadonlyArray<{
    id: number
    numero_pedido: string
    sucursal_id: number
    estado: PedidoEstado
    tipo_entrega: "retiro_local" | "domicilio"
    total: string | number
    fecha_solicitud: string
    sucursal?: { id: number; nombre: string } | null
  }>
}

function adapt(payload: ApiPayload): ClienteDashboardData {
  return {
    kpis: {
      pedidosPendientes: payload.kpis.pedidos_pendientes,
      pedidosEnCamino: payload.kpis.pedidos_en_camino,
      pedidosEntregados: payload.kpis.pedidos_entregados,
      totalGastado: payload.kpis.total_gastado,
    },
    pedidosRecientes: payload.pedidos_recientes.map((p) => ({
      id: p.id,
      numeroPedido: p.numero_pedido,
      sucursalNombre: p.sucursal?.nombre ?? `Sucursal #${p.sucursal_id}`,
      estado: p.estado,
      tipoEntrega: p.tipo_entrega,
      total: typeof p.total === "number" ? p.total : Number(p.total),
      fechaSolicitud: p.fecha_solicitud,
    })),
  }
}

type State =
  | { status: "loading" }
  | { status: "ready"; data: ClienteDashboardData }
  | { status: "error"; error: string }

export function useClienteDashboard(): State {
  const [state, setState] = useState<State>({ status: "loading" })

  useEffect(() => {
    const ctrl = new AbortController()
    apiFetch<ApiPayload>("/cliente/dashboard", { signal: ctrl.signal })
      .then((payload) => setState({ status: "ready", data: adapt(payload) }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        const msg =
          err instanceof ApiError
            ? ((err.payload as { message?: string } | undefined)?.message ??
              `Error ${err.status} al cargar dashboard`)
            : err instanceof Error
              ? err.message
              : "Error desconocido"
        setState({ status: "error", error: msg })
      })
    return () => ctrl.abort()
  }, [])

  return state
}
