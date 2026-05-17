"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { ApiError, apiFetch } from "@/lib/api"

export type CatalogoMedicamento = {
  id: number
  nombre_comercial: string
  principio_activo: string
  codigo_barras: string | null
  precio: string | number
  requiere_receta: boolean
  categoria_id: number
  categoria_nombre: string
  stock_disponible: number
}

export type CatalogoFilters = {
  page: number
  perPage: number
  q?: string
  categoriaId?: number
  soloSinReceta?: boolean
}

export type CatalogoPaginated = {
  data: CatalogoMedicamento[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

function buildQuery(f: CatalogoFilters): string {
  const p = new URLSearchParams()
  p.set("page", String(f.page))
  p.set("per_page", String(f.perPage))
  if (f.q?.trim()) p.set("q", f.q.trim())
  if (f.categoriaId) p.set("categoria_id", String(f.categoriaId))
  if (f.soloSinReceta) p.set("solo_sin_receta", "1")
  return p.toString()
}

type State =
  | { status: "loading" }
  | { status: "ready"; data: CatalogoPaginated }
  | { status: "error"; error: string }

export function useCatalogo(filters: CatalogoFilters): State {
  const [state, setState] = useState<State>({ status: "loading" })

  useEffect(() => {
    const ctrl = new AbortController()
    setState({ status: "loading" })
    apiFetch<CatalogoPaginated>(`/cliente/catalogo?${buildQuery(filters)}`, {
      signal: ctrl.signal,
    })
      .then((data) => setState({ status: "ready", data }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        const msg =
          err instanceof ApiError
            ? ((err.payload as { message?: string } | undefined)?.message ??
              `Error ${err.status} al cargar catalogo`)
            : err instanceof Error
              ? err.message
              : "Error desconocido"
        setState({ status: "error", error: msg })
      })
    return () => ctrl.abort()
  }, [filters])

  return state
}

/* ============================ Carrito (localStorage) ============================ */

const CART_KEY = "farmedic.cliente.carrito"

export type CartItem = {
  medicamento: CatalogoMedicamento
  cantidad: number
}

function readCart(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CART_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CartItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeCart(items: CartItem[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    setItems(readCart())
  }, [])

  const persist = useCallback((next: CartItem[]) => {
    setItems(next)
    writeCart(next)
  }, [])

  const addItem = useCallback(
    (med: CatalogoMedicamento) => {
      const current = readCart()
      const idx = current.findIndex((it) => it.medicamento.id === med.id)
      let next: CartItem[]
      if (idx >= 0) {
        next = [...current]
        const nueva = Math.min(next[idx].cantidad + 1, med.stock_disponible)
        next[idx] = { ...next[idx], cantidad: nueva }
      } else if (med.stock_disponible > 0) {
        next = [...current, { medicamento: med, cantidad: 1 }]
      } else {
        return
      }
      persist(next)
    },
    [persist],
  )

  const setCantidad = useCallback(
    (medicamentoId: number, cantidad: number) => {
      const current = readCart()
      const next = current
        .map((it) => {
          if (it.medicamento.id !== medicamentoId) return it
          const c = Math.max(0, Math.min(cantidad, it.medicamento.stock_disponible))
          return { ...it, cantidad: c }
        })
        .filter((it) => it.cantidad > 0)
      persist(next)
    },
    [persist],
  )

  const removeItem = useCallback(
    (medicamentoId: number) => {
      const next = readCart().filter((it) => it.medicamento.id !== medicamentoId)
      persist(next)
    },
    [persist],
  )

  const clear = useCallback(() => persist([]), [persist])

  const requiereReceta = useMemo(
    () => items.some((it) => it.medicamento.requiere_receta && it.cantidad > 0),
    [items],
  )

  const totalItems = useMemo(
    () => items.reduce((sum, it) => sum + it.cantidad, 0),
    [items],
  )

  return { items, addItem, setCantidad, removeItem, clear, requiereReceta, totalItems }
}

export function calcularTotales(items: CartItem[], ivaTasa: number) {
  const subtotal = items.reduce(
    (sum, it) => sum + Number(it.medicamento.precio) * it.cantidad,
    0,
  )
  const impuesto = Math.round(subtotal * (ivaTasa / 100) * 100) / 100
  const total = subtotal + impuesto
  return { subtotal, impuesto, total }
}

/* ============================ Pedido (mutation + lookups) ============================ */

export type PedidoTipoEntrega = "retiro_local" | "domicilio"

export type PedidoCreateInput = {
  sucursal_id: number
  receta_id: number | null
  tipo_entrega: PedidoTipoEntrega
  direccion_envio: string | null
  telefono_contacto: string
  items: { medicamento_id: number; cantidad: number }[]
}

export type PedidoResponse = {
  id: number
  numero_pedido: string
  sucursal_id: number
  cliente_id: number
  estado: "pendiente" | "en_camino" | "entregado" | "cancelado"
  tipo_entrega: PedidoTipoEntrega
  direccion_envio: string | null
  telefono_contacto: string
  subtotal: string | number
  iva_tasa_aplicada: string | number
  impuesto_total: string | number
  total: string | number
  fecha_solicitud: string
  items: Array<{
    id: number
    medicamento_id: number
    lote_id: number | null
    cantidad: number
    precio_unitario: string | number
    subtotal: string | number
    medicamento?: { id: number; nombre_comercial: string; principio_activo: string }
  }>
}

export async function crearPedido(input: PedidoCreateInput): Promise<PedidoResponse> {
  return apiFetch<PedidoResponse>("/pedidos", { method: "POST", body: input })
}

export type SucursalOption = { id: number; nombre: string; ciudad: string; activa: boolean }

export async function fetchSucursalesActivas(): Promise<SucursalOption[]> {
  type Paginated<T> = { data: T[] } | T[]
  const payload = await apiFetch<Paginated<SucursalOption>>("/sucursales?per_page=200")
  const arr = Array.isArray(payload) ? payload : payload.data
  return arr.filter((s) => s.activa !== false)
}

export type CategoriaOption = { id: number; nombre: string }

export async function fetchCategorias(): Promise<CategoriaOption[]> {
  type Paginated<T> = { data: T[] } | T[]
  const payload = await apiFetch<Paginated<CategoriaOption>>("/categorias?per_page=200")
  return Array.isArray(payload) ? payload : payload.data
}

export async function fetchIvaTasa(): Promise<number> {
  const farmacia = await apiFetch<{ iva_tasa: string | number }>("/farmacia")
  return Number(farmacia.iva_tasa)
}
