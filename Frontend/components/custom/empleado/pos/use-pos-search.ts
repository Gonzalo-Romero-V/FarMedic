"use client"

import { useEffect, useState } from "react"

import { ApiError, apiFetch } from "@/lib/api"

import type { PosMedicamento } from "./use-pos"

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; results: PosMedicamento[] }
  | { status: "error"; error: string }

/** Búsqueda debounced contra /pos/medicamentos. Devuelve solo medicamentos con stock>0. */
export function usePosSearch(query: string, debounceMs = 250): SearchState {
  const [state, setState] = useState<SearchState>({ status: "idle" })

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length === 0) {
      setState({ status: "idle" })
      return
    }

    const ctrl = new AbortController()
    const t = setTimeout(() => {
      setState({ status: "loading" })
      apiFetch<PosMedicamento[]>(
        `/pos/medicamentos?q=${encodeURIComponent(trimmed)}`,
        { signal: ctrl.signal },
      )
        .then((results) => setState({ status: "ready", results }))
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return
          const msg =
            err instanceof ApiError
              ? ((err.payload as { message?: string } | undefined)?.message ??
                `Error ${err.status} al buscar medicamentos`)
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
