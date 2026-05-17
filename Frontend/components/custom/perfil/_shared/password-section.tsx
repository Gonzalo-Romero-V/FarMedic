"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  loading: boolean
  onSubmit: (values: { password_actual: string; password_nueva: string }) => Promise<void>
}

const EMPTY = { actual: "", nueva: "", confirma: "" }

export function PasswordSection({ loading, onSubmit }: Props) {
  const [values, setValues] = useState(EMPTY)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (values.nueva.length < 8) {
      setError("La contraseña nueva debe tener al menos 8 caracteres")
      return
    }
    if (values.nueva !== values.confirma) {
      setError("La confirmación no coincide")
      return
    }
    if (values.nueva === values.actual) {
      setError("La contraseña nueva debe ser distinta de la actual")
      return
    }
    try {
      await onSubmit({
        password_actual: values.actual,
        password_nueva: values.nueva,
      })
      setValues(EMPTY)
    } catch {
      // toast ya disparado por el hook; no limpiamos el form
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-md border bg-card p-4"
    >
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Contraseña
        </h2>
        <p className="text-xs text-muted-foreground">
          Al guardar se cerrarán tus otras sesiones activas.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="perfil-pw-actual">Contraseña actual</Label>
          <Input
            id="perfil-pw-actual"
            type="password"
            value={values.actual}
            onChange={(e) => setValues({ ...values, actual: e.target.value })}
            required
            autoComplete="current-password"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="perfil-pw-nueva">Nueva contraseña</Label>
          <Input
            id="perfil-pw-nueva"
            type="password"
            value={values.nueva}
            onChange={(e) => setValues({ ...values, nueva: e.target.value })}
            required
            autoComplete="new-password"
            minLength={8}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="perfil-pw-confirma">Repetir nueva</Label>
          <Input
            id="perfil-pw-confirma"
            type="password"
            value={values.confirma}
            onChange={(e) => setValues({ ...values, confirma: e.target.value })}
            required
            autoComplete="new-password"
            minLength={8}
          />
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={loading || !values.actual || !values.nueva || !values.confirma}
          size="sm"
        >
          {loading ? "Guardando…" : "Cambiar contraseña"}
        </Button>
      </div>
    </form>
  )
}
