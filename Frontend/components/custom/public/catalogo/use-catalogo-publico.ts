"use client"

import { useEffect, useState } from "react"

import { ApiError, apiFetch } from "@/lib/api"

export type CatalogoPublicoRow = {
  id: number
  nombre_comercial: string
  principio_activo: string
  codigo_barras: string | null
  precio: string | number
  requiere_receta: boolean
  categoria_id: number
  categoria?: { id: number; nombre: string }
  sucursal_id: number
  sucursal?: { id: number; nombre: string }
}

export type CatalogoPublicoFilters = {
  page: number
  perPage: number
  q?: string
  categoriaId?: number
}

export type CatalogoPublicoPaginated = {
  data: CatalogoPublicoRow[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

function buildQuery(f: CatalogoPublicoFilters): string {
  const p = new URLSearchParams()
  p.set("page", String(f.page))
  p.set("per_page", String(f.perPage))
  if (f.q?.trim()) p.set("q", f.q.trim())
  if (f.categoriaId) p.set("categoria_id", String(f.categoriaId))
  return p.toString()
}

type State =
  | { status: "loading" }
  | { status: "ready"; data: CatalogoPublicoPaginated }
  | { status: "error"; error: string }

/**
 * Vista pública del catálogo (sin auth). Usa `GET /api/medicamentos` que ya es
 * público para el invitado (decisions/api-contracts.md). Sin agregado de stock —
 * el invitado solo ve qué productos existen; precios y disponibilidad real los
 * ve recién al registrarse (RF-09 / [[rbac]] permiso `catalog.read` para invitado).
 */
export function useCatalogoPublico(filters: CatalogoPublicoFilters): State {
  const [state, setState] = useState<State>({ status: "loading" })

  useEffect(() => {
    const ctrl = new AbortController()
    setState({ status: "loading" })
    apiFetch<CatalogoPublicoPaginated>(`/medicamentos?${buildQuery(filters)}`, {
      signal: ctrl.signal,
    })
      .then((data) => setState({ status: "ready", data }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        const msg =
          err instanceof ApiError
            ? `Error ${err.status} al cargar catálogo`
            : err instanceof Error
              ? err.message
              : "Error desconocido"
        setState({ status: "error", error: msg })
      })
    return () => ctrl.abort()
  }, [filters])

  return state
}
