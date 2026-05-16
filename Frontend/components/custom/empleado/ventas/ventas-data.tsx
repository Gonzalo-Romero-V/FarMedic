"use client"

import { useMemo, useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import { VentaDetalleDialog } from "./venta-detalle-dialog"
import { VentasFiltersBar } from "./ventas-filters"
import { VentasTable } from "./ventas-table"
import { useEmpleadoVentas, type VentasFilters } from "./use-empleado-ventas"

/**
 * Island root del historial de ventas del empleado. El backend ya restringe el
 * listado a su sucursal (VentaController@index toma sucursal_id de auth()).
 */
export function VentasData() {
  const [filters, setFilters] = useState<VentasFilters>({ page: 1, perPage: 25 })
  const [detalleId, setDetalleId] = useState<number | null>(null)
  const state = useEmpleadoVentas(filters)

  const data = state.status === "ready" ? state.data : null
  const loading = state.status === "loading"

  const rangoTotal = useMemo(() => {
    if (!data) return null
    return `${data.from ?? 0}-${data.to ?? 0} de ${data.total}`
  }, [data])

  return (
    <div className="flex flex-col gap-4">
      <VentasFiltersBar filters={filters} onChange={setFilters} />

      {state.status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <VentasTable
        data={data?.data ?? []}
        loading={loading}
        onView={(id) => setDetalleId(id)}
      />

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{rangoTotal}</span>
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

      <VentaDetalleDialog ventaId={detalleId} onClose={() => setDetalleId(null)} />
    </div>
  )
}
