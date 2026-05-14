"use client"

import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { useAdminLookups } from "../../_shared/use-lookups"
import { LoteAltaSheet } from "./lote-alta-sheet"
import { LoteEditSheet } from "./lote-edit-sheet"
import { LotesFiltersBar } from "./lotes-filters"
import { LotesTable } from "./lotes-table"
import { type LoteRow, type LotesFilters, useAdminLotes } from "./use-admin-lotes"

const DEFAULT_FILTERS: LotesFilters = { page: 1, perPage: 25 }
const SEARCH_DEBOUNCE_MS = 300

/**
 * Isla cliente que orquesta filtros, listado, alta y edición de lotes.
 * - Pre-carga lookups (sucursales, proveedores, medicamentos) una vez.
 * - Debounce sobre la búsqueda libre para no fetch por cada keystroke.
 * - Tras crear/editar un lote, dispara `reload()` del hook.
 */
export function LotesData() {
  const lookupsState = useAdminLookups()
  const [filters, setFilters] = useState<LotesFilters>(DEFAULT_FILTERS)
  const [searchInput, setSearchInput] = useState("")
  const [editing, setEditing] = useState<LoteRow | null>(null)

  // Debounce de búsqueda libre
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

  const lotesState = useAdminLotes(filters)

  // Sincronizamos el input visible con filters.q externos
  const filtersForBar = useMemo<LotesFilters>(
    () => ({ ...filters, q: searchInput }),
    [filters, searchInput],
  )

  const handleFiltersChange = (next: LotesFilters) => {
    if (next.q !== filters.q) setSearchInput(next.q ?? "")
    setFilters({ ...next, q: filters.q }) // q lo maneja el debounce
  }

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

  const data = lotesState.status === "ready" ? lotesState.data : null
  const loading = lotesState.status === "loading"

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <LotesFiltersBar
              filters={filtersForBar}
              sucursales={lookupsState.sucursales}
              onChange={handleFiltersChange}
            />
          </div>
          <div className="sm:pt-7">
            <LoteAltaSheet
              medicamentos={lookupsState.medicamentos}
              sucursales={lookupsState.sucursales}
              proveedores={lookupsState.proveedores}
              onCreated={lotesState.reload}
            />
          </div>
        </div>

        {lotesState.status === "error" && (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>Error al cargar lotes</AlertTitle>
            <AlertDescription>{lotesState.error}</AlertDescription>
          </Alert>
        )}

        <div className="rounded-xl bg-card ring-1 ring-foreground/10">
          <LotesTable
            rows={data?.data}
            loading={loading}
            onEdit={(lote) => setEditing(lote)}
          />
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

      <LoteEditSheet
        lote={editing}
        onClose={() => setEditing(null)}
        onUpdated={lotesState.reload}
      />
    </>
  )
}
