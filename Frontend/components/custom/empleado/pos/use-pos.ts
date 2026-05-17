"use client"

import { useCallback, useMemo, useState } from "react"

import { apiFetch } from "@/lib/api"

/**
 * Estado del POS empleado: carrito + helpers + submit.
 *
 * El backend (VentaController@store) toma sucursal_id y usuario_id de auth(); el
 * frontend NO los manda. La sucursal del empleado limita la búsqueda en /pos/medicamentos
 * por el mismo motivo.
 *
 * Una sola receta por venta (domain/venta.md): el bloque de receta es opcional en el
 * payload y solo se exige cuando el carrito contiene al menos un item con
 * requiere_receta=true. El UI lo muestra/oculta reactivamente.
 */

export type MetodoPago = "efectivo" | "tarjeta" | "transferencia"

export type PosMedicamento = {
  id: number
  nombre_comercial: string
  principio_activo: string
  codigo_barras: string | null
  precio: number
  requiere_receta: boolean
  stock_actual: number
}

export type CartItem = {
  medicamento: PosMedicamento
  cantidad: number
  /** Descuento total aplicado al item (USD absoluto, no porcentaje). Se reparte
   *  proporcionalmente entre lotes si el item se sirve desde varios lotes FEFO. */
  descuento: number
}

export type PosClienteOption = {
  id: number
  nombre: string
  email: string
}

export type VentaCreateInput = {
  cliente_id: number | null
  receta_id: number | null
  metodo_pago: MetodoPago
  items: {
    medicamento_id: number
    cantidad: number
    descuento_item?: number
  }[]
}

export type VentaItemResponse = {
  id: number
  lote_id: number
  cantidad: number
  precio_unitario: string | number
  descuento_item: string | number
  subtotal: string | number
  lote?: {
    id: number
    numero_lote: string
    medicamento?: { id: number; nombre_comercial: string; principio_activo: string }
  }
}

export type VentaResponse = {
  id: number
  sucursal_id: number
  usuario_id: number
  cliente_id: number | null
  receta_id: number | null
  numero_comprobante: string
  subtotal: string | number
  descuento_total: string | number
  iva_tasa_aplicada: string | number
  impuesto_total: string | number
  total: string | number
  metodo_pago: MetodoPago
  estado: "completada" | "anulada"
  fecha: string
  items: VentaItemResponse[]
  cliente?: { id: number; nombre: string; email: string } | null
  receta?: { id: number; numero: string | null } | null
  usuario?: { id: number; nombre: string }
}

export type RecetaCreateInput = {
  numero?: string
  doctor?: string
  fecha_emision?: string
  observaciones?: string
  imagen?: File
}

export type RecetaResponse = { id: number; numero: string | null; imagen_url: string | null }

export function usePosCart() {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = useCallback((med: PosMedicamento) => {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.medicamento.id === med.id)
      if (idx >= 0) {
        const next = [...prev]
        const nuevaCantidad = Math.min(next[idx].cantidad + 1, med.stock_actual)
        next[idx] = { ...next[idx], cantidad: nuevaCantidad }
        return next
      }
      if (med.stock_actual <= 0) return prev
      return [...prev, { medicamento: med, cantidad: 1, descuento: 0 }]
    })
  }, [])

  const setCantidad = useCallback((medicamentoId: number, cantidad: number) => {
    setItems((prev) =>
      prev
        .map((it) => {
          if (it.medicamento.id !== medicamentoId) return it
          const clamped = Math.max(0, Math.min(cantidad, it.medicamento.stock_actual))
          // Si la cantidad cae a 0 el item se filtra; recalcular descuento maximo
          // tampoco hace falta porque la linea desaparece.
          const maxDescuento = it.medicamento.precio * clamped
          return { ...it, cantidad: clamped, descuento: Math.min(it.descuento, maxDescuento) }
        })
        .filter((it) => it.cantidad > 0),
    )
  }, [])

  const setDescuento = useCallback((medicamentoId: number, descuento: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.medicamento.id !== medicamentoId) return it
        const max = it.medicamento.precio * it.cantidad
        const clamped = Math.max(0, Math.min(descuento, max))
        return { ...it, descuento: clamped }
      }),
    )
  }, [])

  const removeItem = useCallback((medicamentoId: number) => {
    setItems((prev) => prev.filter((it) => it.medicamento.id !== medicamentoId))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const requiereReceta = useMemo(
    () => items.some((it) => it.medicamento.requiere_receta && it.cantidad > 0),
    [items],
  )

  return { items, addItem, setCantidad, setDescuento, removeItem, clear, requiereReceta }
}

/**
 * Totales con IVA snapshot — solo para previsualizar en el carrito.
 * Los valores autoritativos los calcula el backend y vienen en VentaResponse.
 * Descuentos por item (USD) se restan del bruto antes de calcular IVA.
 */
export function calcularTotales(items: CartItem[], ivaTasa: number) {
  const bruto = items.reduce((sum, it) => sum + it.medicamento.precio * it.cantidad, 0)
  const descuentos = items.reduce((sum, it) => sum + (it.descuento ?? 0), 0)
  const subtotal = Math.max(0, bruto - descuentos)
  const impuesto = Math.round(subtotal * (ivaTasa / 100) * 100) / 100
  const total = subtotal + impuesto
  return { bruto, descuentos, subtotal, impuesto, total }
}

export async function crearReceta(input: RecetaCreateInput): Promise<RecetaResponse> {
  const form = new FormData()
  if (input.numero) form.append("numero", input.numero)
  if (input.doctor) form.append("doctor", input.doctor)
  if (input.fecha_emision) form.append("fecha_emision", input.fecha_emision)
  if (input.observaciones) form.append("observaciones", input.observaciones)
  if (input.imagen) form.append("imagen", input.imagen)

  return apiFetch<RecetaResponse>("/recetas", { method: "POST", body: form })
}

export async function crearVenta(input: VentaCreateInput): Promise<VentaResponse> {
  return apiFetch<VentaResponse>("/ventas", { method: "POST", body: input })
}

/**
 * Descarga el comprobante PDF de una venta. Mismo patrón que descargarReportePdf
 * en admin/reportes: blob + Bearer (window.open no permite headers custom).
 */
export async function descargarComprobantePdf(
  ventaId: number,
  numeroComprobante: string,
): Promise<void> {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ""
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null

  const res = await fetch(`${API_BASE}/api/ventas/${ventaId}/comprobante.pdf`, {
    headers: {
      Accept: "application/pdf",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!res.ok) {
    let message = `Error ${res.status}`
    try {
      const payload = (await res.json()) as { message?: string }
      if (payload?.message) message = payload.message
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `comprobante-${numeroComprobante}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Lookup público: la tasa de IVA vive en Farmacia y la usamos para previsualizar. */
export async function fetchIvaTasa(): Promise<number> {
  const farmacia = await apiFetch<{ iva_tasa: string | number }>("/farmacia")
  return Number(farmacia.iva_tasa)
}
