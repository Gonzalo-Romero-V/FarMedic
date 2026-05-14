"use client"

import { useEffect, useState } from "react"

import { apiFetch } from "@/lib/api"

/**
 * Lookups compartidos por las sub-páginas de inventario: catálogos pequeños
 * (sucursales, proveedores, medicamentos, categorías) usados como opciones de
 * selects y filtros. Se cargan una vez por isla cliente.
 *
 * Las APIs paginadas devuelven `{ data: [...], total, ... }`. Cuando el catálogo
 * es chico (sucursales ≈ N, categorías ≈ N) basta `per_page=200`. Para medicamentos
 * grandes hay que usar `q` en autocomplete; para el lote form (V1) precargamos 500.
 */

export type LookupOption = { id: number; label: string }

type Paginated<T> = { data: T[] } | T[]

function asArray<T>(payload: Paginated<T>): T[] {
  return Array.isArray(payload) ? payload : payload.data
}

async function loadOptions<T extends { id: number }>(
  path: string,
  labelFn: (item: T) => string,
  signal: AbortSignal,
): Promise<LookupOption[]> {
  const payload = await apiFetch<Paginated<T>>(path, { signal })
  return asArray(payload).map((it) => ({ id: it.id, label: labelFn(it) }))
}

type LookupsState =
  | { status: "loading" }
  | { status: "ready"; sucursales: LookupOption[]; proveedores: LookupOption[]; medicamentos: LookupOption[]; categorias: LookupOption[] }
  | { status: "error"; error: string }

export function useInventarioLookups(): LookupsState {
  const [state, setState] = useState<LookupsState>({ status: "loading" })

  useEffect(() => {
    const ctrl = new AbortController()
    Promise.all([
      loadOptions<{ id: number; nombre: string; ciudad: string }>(
        "/sucursales?per_page=200",
        (s) => `${s.nombre} · ${s.ciudad}`,
        ctrl.signal,
      ),
      loadOptions<{ id: number; nombre: string }>(
        "/proveedores?per_page=200",
        (p) => p.nombre,
        ctrl.signal,
      ),
      loadOptions<{ id: number; nombre_comercial: string; principio_activo: string }>(
        "/medicamentos?per_page=500",
        (m) => `${m.nombre_comercial} — ${m.principio_activo}`,
        ctrl.signal,
      ),
      loadOptions<{ id: number; nombre: string }>(
        "/categorias?per_page=200",
        (c) => c.nombre,
        ctrl.signal,
      ),
    ])
      .then(([sucursales, proveedores, medicamentos, categorias]) =>
        setState({ status: "ready", sucursales, proveedores, medicamentos, categorias }),
      )
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        const msg = err instanceof Error ? err.message : "Error cargando catálogos"
        setState({ status: "error", error: msg })
      })
    return () => ctrl.abort()
  }, [])

  return state
}
