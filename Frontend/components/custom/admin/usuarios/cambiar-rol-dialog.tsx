"use client"

import { Shield } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { useAdminLookups } from "@/components/custom/admin/_shared/use-lookups"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ApiError } from "@/lib/api"

import { RolBadge } from "./rol-badge"
import {
  cambiarRol,
  fetchRoles,
  type Rol,
  type RolNombre,
  type UsuarioRow,
} from "./use-admin-usuarios"

type Props = {
  usuario: UsuarioRow | null
  onClose: () => void
  onSaved: () => void
}

export function CambiarRolDialog({ usuario, onClose, onSaved }: Props) {
  const [roles, setRoles] = useState<Rol[]>([])
  const [rolNuevoId, setRolNuevoId] = useState<number | null>(null)
  const [sucursalId, setSucursalId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const lookups = useAdminLookups()
  const sucursales = lookups.status === "ready" ? lookups.sucursales : []

  useEffect(() => {
    if (!usuario) return
    fetchRoles()
      .then((r) => setRoles(r))
      .catch(() => setRoles([]))
    setRolNuevoId(usuario.rol_id)
    setSucursalId(usuario.sucursal_id)
  }, [usuario])

  if (!usuario) return null

  const rolNuevo = roles.find((r) => r.id === rolNuevoId)
  const requiereSucursal =
    rolNuevo && (rolNuevo.nombre === "administrador" || rolNuevo.nombre === "empleado")

  const sinCambios =
    rolNuevoId === usuario.rol_id &&
    (rolNuevo?.nombre === "cliente"
      ? usuario.sucursal_id === null
      : sucursalId === usuario.sucursal_id)

  const bloqueado =
    submitting || sinCambios || rolNuevoId === null || (requiereSucursal && !sucursalId)

  const handleConfirmar = async () => {
    if (rolNuevoId === null) return
    setSubmitting(true)
    try {
      await cambiarRol(usuario.id, {
        rol_id: rolNuevoId,
        sucursal_id: rolNuevo?.nombre === "cliente" ? null : sucursalId,
      })
      toast.success(`Rol actualizado para ${usuario.nombre}`)
      onSaved()
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.payload as { message?: string } | undefined)?.message ?? `Error ${err.status}`)
          : err instanceof Error
            ? err.message
            : "Error al cambiar rol"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={usuario !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Cambiar rol
          </DialogTitle>
          <DialogDescription>
            Modifica el rol de {usuario.nombre} ({usuario.email}). Si pasa a cliente, su sucursal se libera.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3 text-sm">
            <span className="text-muted-foreground">Rol actual</span>
            {usuario.rol ? <RolBadge rol={usuario.rol.nombre} /> : <span>—</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Nuevo rol</Label>
            <Select
              value={rolNuevoId !== null ? String(rolNuevoId) : undefined}
              onValueChange={(v) => setRolNuevoId(Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {requiereSucursal && (
            <div className="flex flex-col gap-1.5">
              <Label>Sucursal</Label>
              <Select
                value={sucursalId !== null ? String(sucursalId) : undefined}
                onValueChange={(v) => setSucursalId(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {sucursales.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="xs text-muted-foreground">
                Administrador y empleado requieren una sucursal asignada.
              </p>
            </div>
          )}

          {rolNuevo?.nombre === "cliente" && usuario.sucursal_id !== null && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              Al pasar a cliente, se quitará la asignación de sucursal actual.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} disabled={bloqueado}>
            {submitting ? "Aplicando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
