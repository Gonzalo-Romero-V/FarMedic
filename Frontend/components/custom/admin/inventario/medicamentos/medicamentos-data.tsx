"use client"

import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { useAdminLookups } from "../../_shared/use-lookups"
import { MedicamentosFiltersBar } from "./medicamentos-filters"
import { MedicamentosTable } from "./medicamentos-table"
import { type MedicamentosFilters, useAdminMedicamentos } from "./use-admin-medicamentos"

const DEFAULT_FILTERS: MedicamentosFilters = { page: 1, perPage: 25 }
const SEARCH_DEBOUNCE_MS = 300

export function MedicamentosData() {
  const lookupsState = useAdminLookups()
  const [filters, setFilters] = useState<MedicamentosFilters>(DEFAULT_FILTERS)
  const [searchInput, setSearchInput] = useState("")

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((prev) =>
        prev.q === (searchInput || undefined)
          ? prev
          : { ...prev, page: 1, q: searchInput || undefined },
      )
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [searchInput])

  const medicamentosState = useAdminMedicamentos(filters)

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

  const data = medicamentosState.status === "ready" ? medicamentosState.data : null
  const loading = medicamentosState.status === "loading"

  return (
    <div className="flex flex-col gap-4">
      <MedicamentosFiltersBar
        filters={{ ...filters, q: searchInput }}
        sucursales={lookupsState.sucursales}
        categorias={lookupsState.categorias}
        onChange={(next) => {
          if (next.q !== searchInput) setSearchInput(next.q ?? "")
          setFilters({ ...next, q: filters.q }) // q lo maneja el debounce
        }}
      />

      {medicamentosState.status === "error" && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Error al cargar medicamentos</AlertTitle>
          <AlertDescription>{medicamentosState.error}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-xl bg-card ring-1 ring-foreground/10">
        <MedicamentosTable rows={data?.data} loading={loading} />
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
