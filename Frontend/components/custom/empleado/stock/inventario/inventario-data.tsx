"use client"

import { useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import { useEmpleadoLookups } from "../../_shared/use-empleado-lookups"
import { InventarioFiltersBar } from "./inventario-filters"
import { InventarioTable } from "./inventario-table"
import {
  useStockInventario,
  type StockFilters,
} from "./use-stock-inventario"

export function InventarioData() {
  const [filters, setFilters] = useState<StockFilters>({ page: 1, perPage: 25 })
  const lookups = useEmpleadoLookups()
  const state = useStockInventario(filters)

  const categorias = lookups.status === "ready" ? lookups.categorias : []
  const data = state.status === "ready" ? state.data : null

  return (
    <div className="flex flex-col gap-4">
      <InventarioFiltersBar
        filters={filters}
        categorias={categorias}
        onChange={setFilters}
      />

      {state.status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="overflow-hidden rounded-md border bg-card">
        <InventarioTable rows={data?.data} loading={state.status === "loading"} />
      </div>

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {data.from ?? 0}-{data.to ?? 0} de {data.total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.current_page <= 1}
              onClick={() => setFilters({ ...filters, page: data.current_page - 1 })}
            >
              Anterior
            </Button>
            <span className="text-xs text-muted-foreground">
              Página {data.current_page} de {data.last_page}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={data.current_page >= data.last_page}
              onClick={() => setFilters({ ...filters, page: data.current_page + 1 })}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
