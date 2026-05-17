"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApiError } from "@/lib/api"

import { SucursalFormSheet } from "./sucursal-form-sheet"
import { SucursalesFiltersBar } from "./sucursales-filters"
import { SucursalesTable } from "./sucursales-table"
import {
  deleteSucursal,
  updateSucursal,
  useAdminSucursales,
  type SucursalRow,
  type SucursalesFilters,
} from "./use-admin-sucursales"

// Mapa con SSR off (Leaflet usa `window`).
const SucursalesMap = dynamic(
  () => import("./sucursales-map").then((m) => m.SucursalesMap),
  { ssr: false, loading: () => <Skeleton className="h-[480px] w-full rounded-md" /> },
)

export function SucursalesData() {
  const [filters, setFilters] = useState<SucursalesFilters>({ soloActivas: true })
  const [editing, setEditing] = useState<SucursalRow | null>(null)
  const [toggling, setToggling] = useState<SucursalRow | null>(null)
  const state = useAdminSucursales(filters)

  const rows = state.status === "ready" ? state.data : undefined

  const handleToggleConfirm = async () => {
    if (!toggling) return
    try {
      if (toggling.activa) {
        await deleteSucursal(toggling.id)
        toast.success(`Sucursal ${toggling.nombre} desactivada`)
      } else {
        await updateSucursal(toggling.id, { activa: true })
        toast.success(`Sucursal ${toggling.nombre} reactivada`)
      }
      setToggling(null)
      state.status === "ready" && setFilters({ ...filters })
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.payload as { message?: string } | undefined)?.message ?? `Error ${err.status}`)
          : err instanceof Error
            ? err.message
            : "Error"
      toast.error(msg)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <SucursalesFiltersBar filters={filters} onChange={setFilters} />
        <SucursalFormSheet onSaved={() => setFilters({ ...filters })} />
      </div>

      {state.status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="tabla">
        <TabsList>
          <TabsTrigger value="tabla">Tabla</TabsTrigger>
          <TabsTrigger value="mapa">Mapa</TabsTrigger>
        </TabsList>

        <TabsContent value="tabla" className="mt-4">
          <div className="overflow-hidden rounded-md border bg-card">
            <SucursalesTable
              rows={rows}
              loading={state.status === "loading"}
              onEdit={setEditing}
              onToggle={setToggling}
            />
          </div>
        </TabsContent>

        <TabsContent value="mapa" className="mt-4">
          <SucursalesMap sucursales={rows ?? []} />
        </TabsContent>
      </Tabs>

      <SucursalFormSheet
        sucursal={editing}
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        onSaved={() => {
          setEditing(null)
          setFilters({ ...filters })
        }}
      />

      <AlertDialog open={toggling !== null} onOpenChange={(o) => !o && setToggling(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggling?.activa ? "Desactivar sucursal" : "Reactivar sucursal"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggling?.activa
                ? `Vas a desactivar ${toggling?.nombre}. No aparecerá en selectores de pedido/POS, pero su historial queda intacto.`
                : `Vas a reactivar ${toggling?.nombre}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleConfirm}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
