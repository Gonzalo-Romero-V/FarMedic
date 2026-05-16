"use client"

import { useEffect, useState } from "react"

import { apiFetch } from "@/lib/api"

/**
 * Lookups compartidos por los módulos del empleado. Diferencia con `useAdminLookups`:
 * - No carga sucursales (el empleado opera en su única sucursal).
 * - Carga medicamentos filtrados por sucursal del user (usa /pos/medicamentos extendido).
 */

export type LookupOption = { id: number; label: string }

export type EmpleadoLookupsState =
  | { status: "loading" }
  | {
      status: "ready"
      categorias: LookupOption[]
      proveedores: LookupOption[]
      medicamentos: LookupOption[]
    }
  | { status: "error"; error: string }

type Paginated<T> = { data: T[] } | T[]

function asArray<T>(p: Paginated<T>): T[] {
  return Array.isArray(p) ? p : p.data
}

export function useEmpleadoLookups(): EmpleadoLookupsState {
  const [state, setState] = useState<EmpleadoLookupsState>({ status: "loading" })

  useEffect(() => {
    const ctrl = new AbortController()
    Promise.all([
      apiFetch<Paginated<{ id: number; nombre: string }>>("/categorias?per_page=200", {
        signal: ctrl.signal,
      }),
      apiFetch<Paginated<{ id: number; nombre: string }>>("/proveedores?per_page=200", {
        signal: ctrl.signal,
      }),
      apiFetch<{ data: { id: number; nombre_comercial: string; principio_activo: string }[] }>(
        "/empleado/inventario/medicamentos?per_page=500",
        { signal: ctrl.signal },
      ),
    ])
      .then(([cats, provs, meds]) => {
        setState({
          status: "ready",
          categorias: asArray(cats).map((c) => ({ id: c.id, label: c.nombre })),
          proveedores: asArray(provs).map((p) => ({ id: p.id, label: p.nombre })),
          medicamentos: meds.data.map((m) => ({
            id: m.id,
            label: `${m.nombre_comercial} — ${m.principio_activo}`,
          })),
        })
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        const msg = err instanceof Error ? err.message : "Error cargando catálogos"
        setState({ status: "error", error: msg })
      })
    return () => ctrl.abort()
  }, [])

  return state
}
