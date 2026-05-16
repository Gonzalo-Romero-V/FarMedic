"use client"

import { Plus, Search } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

import type { PosMedicamento } from "./use-pos"
import { usePosSearch } from "./use-pos-search"

type Props = {
  onAdd: (med: PosMedicamento) => void
}

export function PosSearch({ onAdd }: Props) {
  const [query, setQuery] = useState("")
  const state = usePosSearch(query)

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, principio activo o código de barras..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border bg-card">
        {state.status === "idle" && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Empezá a escribir para ver resultados.
          </div>
        )}

        {state.status === "loading" && (
          <div className="flex flex-col gap-2 p-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {state.status === "error" && (
          <div className="p-6 text-center text-sm text-destructive">{state.error}</div>
        )}

        {state.status === "ready" && state.results.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Sin resultados con stock vigente para “{query}”.
          </div>
        )}

        {state.status === "ready" && state.results.length > 0 && (
          <ul className="divide-y">
            {state.results.map((med) => (
              <li
                key={med.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{med.nombre_comercial}</span>
                    {med.requiere_receta && (
                      <Badge variant="outline" className="border-amber-300 text-amber-700">
                        Receta
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {med.principio_activo}
                    {med.codigo_barras ? ` · ${med.codigo_barras}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="tabular-nums text-muted-foreground">
                    Stock {med.stock_actual}
                  </span>
                  <span className="tabular-nums font-medium">
                    ${med.precio.toFixed(2)}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => onAdd(med)}
                    disabled={med.stock_actual <= 0}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Agregar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
