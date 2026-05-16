"use client"

import { useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import { ClienteHistorialDrawer } from "./cliente-historial-drawer"
import { ClientesFiltersBar } from "./clientes-filters"
import { ClientesTable } from "./clientes-table"
import {
  useEmpleadoClientes,
  type ClientesFilters,
} from "./use-empleado-clientes"

export function ClientesData() {
  const [filters, setFilters] = useState<ClientesFilters>({ page: 1, perPage: 25 })
  const [detalleId, setDetalleId] = useState<number | null>(null)
  const state = useEmpleadoClientes(filters)

  const data = state.status === "ready" ? state.data : null
  const loading = state.status === "loading"

  return (
    <div className="flex flex-col gap-4">
      <ClientesFiltersBar filters={filters} onChange={setFilters} />

      {state.status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <ClientesTable
        data={data?.data ?? []}
        loading={loading}
        onView={(id) => setDetalleId(id)}
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

      <ClienteHistorialDrawer clienteId={detalleId} onClose={() => setDetalleId(null)} />
    </div>
  )
}
