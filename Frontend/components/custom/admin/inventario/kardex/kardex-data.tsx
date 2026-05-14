"use client"

import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { useAdminLookups } from "../../_shared/use-lookups"
import { KardexFiltersBar } from "./kardex-filters"
import { KardexTable } from "./kardex-table"
import { MovimientoAltaDialog } from "./movimiento-alta-dialog"
import { type KardexFilters, useAdminKardex } from "./use-admin-kardex"

const DEFAULT_FILTERS: KardexFilters = { page: 1, perPage: 50 }

export function KardexData() {
  const lookupsState = useAdminLookups()
  const [filters, setFilters] = useState<KardexFilters>(DEFAULT_FILTERS)

  const kardexState = useAdminKardex(filters)

  if (lookupsState.status === "error") {
    return (
      <Alert variant="destructive">
        <AlertTriangle />
        <AlertTitle>No se pudieron cargar los catálogos</AlertTitle>
        <AlertDescription>{lookupsState.error}</AlertDescription>
      </Alert>
    )
  }

  if (lookupsState.status === "loading") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const data = kardexState.status === "ready" ? kardexState.data : null
  const loading = kardexState.status === "loading"

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <KardexFiltersBar
            filters={filters}
            sucursales={lookupsState.sucursales}
            onChange={setFilters}
          />
        </div>
        <div className="sm:pt-7">
          <MovimientoAltaDialog
            medicamentos={lookupsState.medicamentos}
            onCreated={kardexState.reload}
          />
        </div>
      </div>

      {kardexState.status === "error" && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Error al cargar kardex</AlertTitle>
          <AlertDescription>{kardexState.error}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-xl bg-card ring-1 ring-foreground/10">
        <KardexTable rows={data?.data} loading={loading} />
      </div>

      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {data.from}–{data.to} de {data.total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.current_page <= 1 || loading}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Anterior
            </Button>
            <span className="tabular-nums">
              Página {data.current_page} de {data.last_page}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={data.current_page >= data.last_page || loading}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
            >
              Siguiente
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
