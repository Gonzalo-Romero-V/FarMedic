"use client"

import { useEffect, useState } from "react"

import { ApiError, apiFetch } from "@/lib/api"

import type { PedidoResponse } from "../catalogo/use-catalogo"

export type PedidoEstado = "pendiente" | "en_camino" | "entregado" | "cancelado"

export type PedidoRow = {
  id: number
  numero_pedido: string
  sucursal_id: number
  estado: PedidoEstado
  tipo_entrega: "retiro_local" | "domicilio"
  total: string | number
  fecha_solicitud: string
  fecha_envio: string | null
  fecha_entrega: string | null
  sucursal?: { id: number; nombre: string }
}

export type PedidosFilters = {
  page: number
  perPage: number
  estado?: PedidoEstado
}

export type PedidosPaginated = {
  data: PedidoRow[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

function buildQuery(f: PedidosFilters): string {
  const p = new URLSearchParams()
  p.set("page", String(f.page))
  p.set("per_page", String(f.perPage))
  if (f.estado) p.set("estado", f.estado)
  return p.toString()
}

type State =
  | { status: "loading" }
  | { status: "ready"; data: PedidosPaginated }
  | { status: "error"; error: string }

/**
 * Lista de pedidos del cliente. El backend filtra por `cliente_id = auth->id`
 * automáticamente (PedidoController@index).
 */
export function useClientePedidos(filters: PedidosFilters): State {
  const [state, setState] = useState<State>({ status: "loading" })

  useEffect(() => {
    const ctrl = new AbortController()
    setState({ status: "loading" })
    apiFetch<PedidosPaginated>(`/pedidos?${buildQuery(filters)}`, { signal: ctrl.signal })
      .then((data) => setState({ status: "ready", data }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        const msg =
          err instanceof ApiError
            ? ((err.payload as { message?: string } | undefined)?.message ??
              `Error ${err.status} al cargar pedidos`)
            : err instanceof Error
              ? err.message
              : "Error desconocido"
        setState({ status: "error", error: msg })
      })
    return () => ctrl.abort()
  }, [filters])

  return state
}

export async function fetchPedidoDetalle(id: number): Promise<PedidoResponse> {
  return apiFetch<PedidoResponse>(`/pedidos/${id}`)
}
