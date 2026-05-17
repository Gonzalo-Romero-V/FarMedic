"use client"

import { useEffect, useState } from "react"

import { ApiError, apiFetch } from "@/lib/api"

export type ReporteMensual = {
  periodo: {
    year: number
    month: number
    mes_label: string
    desde: string
    hasta: string
  }
  farmacia: { id: number; nombre: string; ruc: string | null } | null
  generado_en: string
  sucursales: Array<{ id: number; nombre: string; ciudad: string }>
  ventas: {
    totalizado: {
      cantidad: number
      subtotal: string | number
      impuesto_total: string | number
      total: string | number
    } | null
    por_sucursal: Array<{
      sucursal_id: number
      nombre: string
      ciudad: string
      cantidad: number
      subtotal: string | number
      impuesto_total: string | number
      total: string | number
    }>
    por_metodo: Array<{
      metodo_pago: "efectivo" | "tarjeta" | "transferencia"
      cantidad: number
      total: string | number
    }>
  }
  top_productos: Array<{
    medicamento_id: number
    nombre_comercial: string
    principio_activo: string
    unidades: number | string
    monto: number | string
    ventas_distintas: number
  }>
  stock_critico: Array<{
    sucursal: string
    items: Array<{
      medicamento_id: number
      medicamento_nombre: string
      stock_actual: number | string
      stock_minimo: number
    }>
  }>
  kardex: {
    totalizado: Array<{ tipo: string; cantidad: number; unidades: number | string }>
    por_sucursal: Array<{
      sucursal: string
      tipos: Array<{ tipo: string; cantidad: number; unidades: number | string }>
    }>
  }
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: ReporteMensual }
  | { status: "error"; error: string }

export function useReporteMensual(year: number | null, month: number | null): State {
  const [state, setState] = useState<State>({ status: "idle" })

  useEffect(() => {
    if (year === null || month === null) {
      setState({ status: "idle" })
      return
    }
    const ctrl = new AbortController()
    setState({ status: "loading" })
    apiFetch<ReporteMensual>(`/admin/reportes/mensual?year=${year}&month=${month}`, {
      signal: ctrl.signal,
    })
      .then((data) => setState({ status: "ready", data }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        const msg =
          err instanceof ApiError
            ? ((err.payload as { message?: string } | undefined)?.message ??
              `Error ${err.status}`)
            : err instanceof Error
              ? err.message
              : "Error desconocido"
        setState({ status: "error", error: msg })
      })
    return () => ctrl.abort()
  }, [year, month])

  return state
}

/**
 * Descarga el PDF como blob (necesario para mandar el Bearer token; `window.open`
 * no permite headers). Genera un object URL y dispara la descarga.
 */
export async function descargarReportePdf(
  year: number,
  month: number,
): Promise<void> {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ""
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null

  const res = await fetch(
    `${API_BASE}/api/admin/reportes/mensual.pdf?year=${year}&month=${month}`,
    {
      headers: {
        Accept: "application/pdf",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  )

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
  a.download = `reporte-${year}-${String(month).padStart(2, "0")}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
