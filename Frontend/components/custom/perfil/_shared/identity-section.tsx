"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type IdentityFields = {
  nombre: string
  telefono: string
  /** Cuando se incluye, se muestra el campo dirección (solo cliente). */
  direccion?: string
}

type Props = {
  email: string
  initial: IdentityFields
  loading: boolean
  /** Si el form incluye dirección (true para cliente). */
  withDireccion?: boolean
  onSubmit: (values: IdentityFields) => Promise<unknown> | void
}

/**
 * Sección presentacional para editar identidad básica. No conoce el rol:
 * el caller decide si pasar `withDireccion`. Email siempre es read-only.
 */
export function IdentitySection({
  email,
  initial,
  loading,
  withDireccion = false,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<IdentityFields>(initial)
  const dirty =
    values.nombre !== initial.nombre ||
    values.telefono !== initial.telefono ||
    (withDireccion && values.direccion !== initial.direccion)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!dirty) return
    await onSubmit(values)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-md border bg-card p-4"
    >
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Datos personales
        </h2>
        <p className="text-xs text-muted-foreground">
          Tu nombre y teléfono. El email se usa para iniciar sesión y no puede
          modificarse desde aquí.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="perfil-nombre">Nombre</Label>
          <Input
            id="perfil-nombre"
            value={values.nombre}
            onChange={(e) => setValues({ ...values, nombre: e.target.value })}
            required
            maxLength={255}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="perfil-email">Email</Label>
          <Input id="perfil-email" value={email} readOnly disabled />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="perfil-telefono">Teléfono</Label>
          <Input
            id="perfil-telefono"
            value={values.telefono}
            onChange={(e) => setValues({ ...values, telefono: e.target.value })}
            maxLength={50}
            placeholder="Opcional"
          />
        </div>
        {withDireccion && (
          <div className="space-y-1.5">
            <Label htmlFor="perfil-direccion">Dirección</Label>
            <Input
              id="perfil-direccion"
              value={values.direccion ?? ""}
              onChange={(e) =>
                setValues({ ...values, direccion: e.target.value })
              }
              maxLength={255}
              placeholder="Para entregas a domicilio"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!dirty || loading} size="sm">
          {loading ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  )
}
