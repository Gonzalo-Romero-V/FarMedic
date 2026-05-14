"use client"

import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/lib/api"

import { useAdminLookups } from "../_shared/use-lookups"
import { CatalogoFiltersBar } from "./catalogo-filters"
import { CatalogoTable } from "./catalogo-table"
import { MedicamentoAltaSheet } from "./medicamento-alta-sheet"
import { MedicamentoEditSheet } from "./medicamento-edit-sheet"
import {
  type CatalogoFilters,
  type MedicamentoRow,
  deleteMedicamento,
  useAdminCatalogo,
} from "./use-admin-catalogo"

const DEFAULT_FILTERS: CatalogoFilters = { page: 1, perPage: 25 }
const SEARCH_DEBOUNCE_MS = 300

export function CatalogoData() {
  const lookupsState = useAdminLookups()
  const [filters, setFilters] = useState<CatalogoFilters>(DEFAULT_FILTERS)
  const [searchInput, setSearchInput] = useState("")
  const [editing, setEditing] = useState<MedicamentoRow | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<MedicamentoRow | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  const catalogoState = useAdminCatalogo(filters)

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await deleteMedicamento(confirmDelete.id)
      toast.success(`${confirmDelete.nombre_comercial} dado de baja`)
      setConfirmDelete(null)
      catalogoState.reload()
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? (err.payload as { message?: string } | undefined)?.message ??
            `Error ${err.status}`
          : err instanceof Error
            ? err.message
            : "Error al eliminar medicamento"
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
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

  const data = catalogoState.status === "ready" ? catalogoState.data : null
  const loading = catalogoState.status === "loading"

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <CatalogoFiltersBar
              filters={{ ...filters, q: searchInput }}
              sucursales={lookupsState.sucursales}
              categorias={lookupsState.categorias}
              onChange={(next) => {
                if (next.q !== searchInput) setSearchInput(next.q ?? "")
                setFilters({ ...next, q: filters.q })
              }}
            />
          </div>
          <div className="sm:pt-7">
            <MedicamentoAltaSheet
              sucursales={lookupsState.sucursales}
              categorias={lookupsState.categorias}
              proveedores={lookupsState.proveedores}
              onCreated={catalogoState.reload}
            />
          </div>
        </div>

        {catalogoState.status === "error" && (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>Error al cargar catálogo</AlertTitle>
            <AlertDescription>{catalogoState.error}</AlertDescription>
          </Alert>
        )}

        <div className="rounded-xl bg-card ring-1 ring-foreground/10">
          <CatalogoTable
            rows={data?.data}
            loading={loading}
            onEdit={(med) => setEditing(med)}
            onDelete={(med) => setConfirmDelete(med)}
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

      <MedicamentoEditSheet
        medicamento={editing}
        categorias={lookupsState.categorias}
        proveedores={lookupsState.proveedores}
        onClose={() => setEditing(null)}
        onUpdated={catalogoState.reload}
      />

      <AlertDialog
        open={confirmDelete !== null}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Dar de baja este medicamento?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.nombre_comercial} quedará archivado (soft delete). El historial de
              ventas pasadas se preserva, pero no podrá venderse más. Puede restaurarse después
              vía API si hace falta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Dando de baja..." : "Sí, dar de baja"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
