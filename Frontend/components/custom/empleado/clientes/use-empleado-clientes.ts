"use client"

import { useCallback, useEffect, useState } from "react"

import { ApiError, apiFetch } from "@/lib/api"

export type ClienteRow = {
  id: number
  nombre: string
  email: string
  created_at: string
  ventas_count: number
  pedidos_count: number
}

export type ClientesPaginated = {
  data: ClienteRow[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export type ClientesFilters = {
  page: number
  perPage: number
  q?: string
}

function buildQuery(f: ClientesFilters): string {
  const p = new URLSearchParams()
  p.set("page", String(f.page))
  p.set("per_page", String(f.perPage))
  if (f.q) p.set("q", f.q)
  return p.toString()
}

type State =
  | { status: "loading" }
  | { status: "ready"; data: ClientesPaginated }
  | { status: "error"; error: string }

export function useEmpleadoClientes(
  filters: ClientesFilters,
): State & { reload: () => void } {
  const [state, setState] = useState<State>({ status: "loading" })
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    setState({ status: "loading" })
    apiFetch<ClientesPaginated>(`/empleado/clientes?${buildQuery(filters)}`, {
      signal: ctrl.signal,
    })
      .then((data) => setState({ status: "ready", data }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        const msg =
          err instanceof ApiError
            ? ((err.payload as { message?: string } | undefined)?.message ??
              `Error ${err.status} al cargar clientes`)
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

export type ClienteDetalleVenta = {
  id: number
  numero_comprobante: string
  fecha: string
  total: string | number
  estado: "completada" | "anulada"
  metodo_pago: "efectivo" | "tarjeta" | "transferencia"
}

export type ClienteDetallePedido = {
  id: number
  numero_pedido: string
  fecha_solicitud: string | null
  total: string | number
  estado: "pendiente" | "en_camino" | "entregado" | "cancelado"
}

export type ClienteDetalle = {
  cliente: {
    id: number
    nombre: string
    email: string
    created_at: string
  }
  ventas: ClienteDetalleVenta[]
  pedidos: ClienteDetallePedido[]
}

export async function fetchClienteDetalle(id: number): Promise<ClienteDetalle> {
  return apiFetch<ClienteDetalle>(`/empleado/clientes/${id}`)
}
