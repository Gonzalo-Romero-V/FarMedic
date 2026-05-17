"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import { PedidosFiltersBar } from "./pedidos-filters"
import { PedidosTable } from "./pedidos-table"
import { useEmpleadoPedidos, type PedidosFilters } from "./use-empleado-pedidos"

/**
 * Island root del listado de pedidos para el empleado.
 *
 * El endpoint `GET /api/pedidos` no filtra por sucursal para admin/empleado
 * (PedidoController@index), así que el empleado ve todos los pedidos. El
 * enforcement de sucursal vive en `cambiarEstado` (403 si no es de su sucursal).
 */
export function PedidosData() {
  const router = useRouter()
  const [filters, setFilters] = useState<PedidosFilters>({
    page: 1,
    perPage: 25,
    estado: "pendiente",
  })
  const state = useEmpleadoPedidos(filters)
  const data = state.status === "ready" ? state.data : null

  return (
    <div className="flex flex-col gap-4">
      <PedidosFiltersBar filters={filters} onChange={setFilters} />

      {state.status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <PedidosTable
        data={data?.data ?? []}
        loading={state.status === "loading"}
        onView={(id) => router.push(`/empleado/pedidos/${id}`)}
      />

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
