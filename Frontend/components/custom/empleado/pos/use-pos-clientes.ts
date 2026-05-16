"use client"

import { useEffect, useState } from "react"

import { ApiError, apiFetch } from "@/lib/api"

import type { PosClienteOption } from "./use-pos"

type ClientesState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; results: PosClienteOption[] }
  | { status: "error"; error: string }

/** Autocomplete de clientes registrados. Si q está vacío, devuelve los primeros N. */
export function usePosClientes(query: string, debounceMs = 250): ClientesState {
  const [state, setState] = useState<ClientesState>({ status: "idle" })

  useEffect(() => {
    const ctrl = new AbortController()
    const t = setTimeout(() => {
      setState({ status: "loading" })
      const path = query.trim()
        ? `/pos/clientes?q=${encodeURIComponent(query.trim())}`
        : "/pos/clientes"
      apiFetch<PosClienteOption[]>(path, { signal: ctrl.signal })
        .then((results) => setState({ status: "ready", results }))
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return
          const msg =
            err instanceof ApiError
              ? ((err.payload as { message?: string } | undefined)?.message ??
                `Error ${err.status} al buscar clientes`)
              : err instanceof Error
                ? err.message
                : "Error de búsqueda"
          setState({ status: "error", error: msg })
        })
    }, debounceMs)

    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [query, debounceMs])

  return state
}
