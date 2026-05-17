"use client"

import { useCallback, useEffect, useState } from "react"

import { ApiError, apiFetch } from "@/lib/api"

export type PedidoEstado = "pendiente" | "en_camino" | "entregado" | "cancelado"
export type PedidoTipoEntrega = "retiro_local" | "domicilio"

export type PedidoRow = {
  id: number
  numero_pedido: string
  sucursal_id: number
  cliente_id: number
  estado: PedidoEstado
  tipo_entrega: PedidoTipoEntrega
  total: string | number
  fecha_solicitud: string
  fecha_envio: string | null
  fecha_entrega: string | null
  sucursal?: { id: number; nombre: string }
  cliente?: { id: number; nombre: string; email: string }
}

export type PedidoItem = {
  id: number
  medicamento_id: number
  lote_id: number | null
  cantidad: number
  precio_unitario: string | number
  subtotal: string | number
  medicamento?: { id: number; nombre_comercial: string; principio_activo: string }
  lote?: { id: number; numero_lote: string; fecha_vencimiento: string } | null
}

export type PedidoDetalle = PedidoRow & {
  receta_id: number | null
  direccion_envio: string | null
  telefono_contacto: string
  subtotal: string | number
  iva_tasa_aplicada: string | number
  impuesto_total: string | number
  items: PedidoItem[]
  gestor?: { id: number; nombre: string } | null
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
 * Listado de pedidos para el empleado. El backend devuelve TODOS los pedidos
 * para roles admin/empleado (PedidoController@index); el filtro por sucursal
 * solo se aplica al transicionar estado (PedidoController@cambiarEstado).
 */
export function useEmpleadoPedidos(
  filters: PedidosFilters,
): State & { reload: () => void } {
  const [state, setState] = useState<State>({ status: "loading" })
  const [reloadToken, setReloadToken] = useState(0)

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
  }, [filters, reloadToken])

  const reload = useCallback(() => setReloadToken((t) => t + 1), [])
  return { ...state, reload }
}

export async function fetchPedidoDetalle(id: number): Promise<PedidoDetalle> {
  return apiFetch<PedidoDetalle>(`/pedidos/${id}`)
}

export async function cambiarEstadoPedido(
  id: number,
  estado: PedidoEstado,
): Promise<PedidoDetalle> {
  return apiFetch<PedidoDetalle>(`/pedidos/${id}/estado`, {
    method: "PATCH",
    body: { estado },
  })
}

const TRANSICIONES: Record<PedidoEstado, PedidoEstado[]> = {
  pendiente: ["en_camino", "cancelado"],
  en_camino: ["entregado", "cancelado"],
  entregado: ["cancelado"],
  cancelado: [],
}

export function transicionesValidas(estado: PedidoEstado): PedidoEstado[] {
  return TRANSICIONES[estado]
}
