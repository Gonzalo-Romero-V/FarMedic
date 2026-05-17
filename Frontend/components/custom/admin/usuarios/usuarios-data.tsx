"use client"

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
import { ApiError } from "@/lib/api"

import { CambiarRolDialog } from "./cambiar-rol-dialog"
import { UsuarioFormSheet } from "./usuario-form-sheet"
import { UsuariosFiltersBar } from "./usuarios-filters"
import { UsuariosTable } from "./usuarios-table"
import {
  deleteUsuario,
  updateUsuario,
  useAdminUsuarios,
  type UsuarioRow,
  type UsuariosFilters,
} from "./use-admin-usuarios"

export function UsuariosData() {
  const [filters, setFilters] = useState<UsuariosFilters>({ soloActivos: true })
  const [editing, setEditing] = useState<UsuarioRow | null>(null)
  const [toggling, setToggling] = useState<UsuarioRow | null>(null)
  const [rolDialog, setRolDialog] = useState<UsuarioRow | null>(null)
  const state = useAdminUsuarios(filters)

  const rows = state.status === "ready" ? state.data : undefined

  const handleToggleConfirm = async () => {
    if (!toggling) return
    try {
      if (toggling.activo) {
        await deleteUsuario(toggling.id)
        toast.success(`Usuario ${toggling.nombre} desactivado`)
      } else {
        await updateUsuario(toggling.id, { activo: true })
        toast.success(`Usuario ${toggling.nombre} reactivado`)
      }
      setToggling(null)
      setFilters({ ...filters })
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
        <UsuariosFiltersBar filters={filters} onChange={setFilters} />
        <UsuarioFormSheet onSaved={() => setFilters({ ...filters })} />
      </div>

      {state.status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="overflow-hidden rounded-md border bg-card">
        <UsuariosTable
          rows={rows}
          loading={state.status === "loading"}
          onEdit={setEditing}
          onToggle={setToggling}
          onCambiarRol={setRolDialog}
        />
      </div>

      <UsuarioFormSheet
        usuario={editing}
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        onSaved={() => {
          setEditing(null)
          setFilters({ ...filters })
        }}
      />

      <CambiarRolDialog
        usuario={rolDialog}
        onClose={() => setRolDialog(null)}
        onSaved={() => {
          setRolDialog(null)
          setFilters({ ...filters })
        }}
      />

      <AlertDialog open={toggling !== null} onOpenChange={(o) => !o && setToggling(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggling?.activo ? "Desactivar usuario" : "Reactivar usuario"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggling?.activo
                ? `Vas a desactivar a ${toggling?.nombre}. Su historial queda intacto pero no podrá iniciar sesión ni operar.`
                : `Vas a reactivar a ${toggling?.nombre}.`}
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
