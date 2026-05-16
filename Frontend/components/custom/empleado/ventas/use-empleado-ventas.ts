"use client"

import { useCallback, useEffect, useState } from "react"

import { ApiError, apiFetch } from "@/lib/api"

import type { VentaResponse } from "../pos/use-pos"

export type VentaEstado = "completada" | "anulada"
export type MetodoPagoFiltro = "efectivo" | "tarjeta" | "transferencia"

export type VentasFilters = {
  page: number
  perPage: number
  estado?: VentaEstado
  metodoPago?: MetodoPagoFiltro
  desde?: string // YYYY-MM-DD
  hasta?: string
}

export type VentasPaginated = {
  data: VentaResponse[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

type State =
  | { status: "loading" }
  | { status: "ready"; data: VentasPaginated }
  | { status: "error"; error: string }

function buildQuery(filters: VentasFilters): string {
  const p = new URLSearchParams()
  p.set("page", String(filters.page))
  p.set("per_page", String(filters.perPage))
  if (filters.estado) p.set("estado", filters.estado)
  if (filters.metodoPago) p.set("metodo_pago", filters.metodoPago)
  if (filters.desde) p.set("desde", filters.desde)
  if (filters.hasta) p.set("hasta", filters.hasta)
  return p.toString()
}

/**
 * Listado de ventas para el empleado. El backend ya filtra por su sucursal
 * usando auth()->user() (VentaController@index).
 */
export function useEmpleadoVentas(
  filters: VentasFilters,
): State & { reload: () => void } {
  const [state, setState] = useState<State>({ status: "loading" })
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    setState({ status: "loading" })
    apiFetch<VentasPaginated>(`/ventas?${buildQuery(filters)}`, { signal: ctrl.signal })
      .then((data) => setState({ status: "ready", data }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        const msg =
          err instanceof ApiError
            ? `Error ${err.status} al cargar ventas`
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

export async function fetchVentaDetalle(id: number): Promise<VentaResponse> {
  return apiFetch<VentaResponse>(`/ventas/${id}`)
}
