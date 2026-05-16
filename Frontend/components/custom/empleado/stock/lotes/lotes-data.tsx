"use client"

import { useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

import { useEmpleadoLookups } from "../../_shared/use-empleado-lookups"
import { LoteAltaSheet } from "./lote-alta-sheet"
import { LoteEditSheet } from "./lote-edit-sheet"
import { LotesFiltersBar } from "./lotes-filters"
import { LotesTable } from "./lotes-table"
import {
  useStockLotes,
  type LoteRow,
  type LotesFilters,
} from "./use-stock-lotes"

export function LotesData() {
  const { user } = useAuth()
  const [filters, setFilters] = useState<LotesFilters>({ page: 1, perPage: 25 })
  const [editing, setEditing] = useState<LoteRow | null>(null)

  const lookups = useEmpleadoLookups()
  const state = useStockLotes(filters, user?.sucursal_id ?? null)

  const medicamentos = lookups.status === "ready" ? lookups.medicamentos : []
  const proveedores = lookups.status === "ready" ? lookups.proveedores : []

  const data = state.status === "ready" ? state.data : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <LotesFiltersBar filters={filters} onChange={setFilters} />
        <LoteAltaSheet
          medicamentos={medicamentos}
          proveedores={proveedores}
          onCreated={() => setFilters((f) => ({ ...f, page: 1 }))}
        />
      </div>

      {state.status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="overflow-hidden rounded-md border bg-card">
        <LotesTable
          rows={data?.data}
          loading={state.status === "loading"}
          onEdit={setEditing}
        />
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

      <LoteEditSheet
        lote={editing}
        onClose={() => setEditing(null)}
        onUpdated={() => setFilters((f) => ({ ...f }))}
      />
    </div>
  )
}
