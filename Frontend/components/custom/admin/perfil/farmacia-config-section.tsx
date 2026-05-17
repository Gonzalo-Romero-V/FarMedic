"use client"

import { Settings2 } from "lucide-react"
import { useEffect, useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

import { useFarmaciaConfig, type FarmaciaConfig } from "./use-farmacia-config"

type FormValues = {
  nombre: string
  ruc: string
  iva_tasa: string
  telefono_contacto: string
  email_contacto: string
}

function toForm(c: FarmaciaConfig): FormValues {
  return {
    nombre: c.nombre,
    ruc: c.ruc,
    iva_tasa: String(c.iva_tasa),
    telefono_contacto: c.telefono_contacto,
    email_contacto: c.email_contacto,
  }
}

/**
 * Configuración global del sistema. Solo el admin la ve y edita.
 * Internamente persiste en la entidad Farmacia (singleton en MVP — ver vault).
 */
export function FarmaciaConfigSection() {
  const { state, saving, update } = useFarmaciaConfig()
  const [values, setValues] = useState<FormValues | null>(null)

  useEffect(() => {
    if (state.status === "ready") setValues(toForm(state.data))
  }, [state])

  if (state.status === "error") {
    return (
      <Alert variant="destructive">
        <AlertDescription>{state.error}</AlertDescription>
      </Alert>
    )
  }

  if (state.status === "loading") {
    return (
      <div className="flex flex-col gap-3 rounded-md border bg-card p-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (!values) {
    return (
      <div className="flex flex-col gap-3 rounded-md border bg-card p-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  const currentData = state.data
  const initial = toForm(currentData)
  const dirty =
    values.nombre !== initial.nombre ||
    values.ruc !== initial.ruc ||
    values.iva_tasa !== initial.iva_tasa ||
    values.telefono_contacto !== initial.telefono_contacto ||
    values.email_contacto !== initial.email_contacto

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!dirty || !values) return
    const iva = Number(values.iva_tasa)
    if (Number.isNaN(iva) || iva < 0 || iva > 100) return
    await update(
      {
        nombre: values.nombre,
        ruc: values.ruc,
        iva_tasa: iva,
        telefono_contacto: values.telefono_contacto,
        email_contacto: values.email_contacto,
      },
      currentData.id,
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-md border bg-card p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Settings2 className="h-3.5 w-3.5" />
            Configuración del sistema
          </h2>
          <p className="text-xs text-muted-foreground">
            Datos legales del negocio e impuestos. Cambios al IVA no afectan
            ventas pasadas (que guardan snapshot).
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="cfg-nombre">Nombre comercial</Label>
          <Input
            id="cfg-nombre"
            value={values.nombre}
            onChange={(e) => setValues({ ...values, nombre: e.target.value })}
            required
            maxLength={255}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cfg-ruc">RUC</Label>
          <Input
            id="cfg-ruc"
            value={values.ruc}
            onChange={(e) => setValues({ ...values, ruc: e.target.value })}
            required
            maxLength={20}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cfg-iva">IVA (%)</Label>
          <Input
            id="cfg-iva"
            type="number"
            step="0.01"
            min={0}
            max={100}
            value={values.iva_tasa}
            onChange={(e) => setValues({ ...values, iva_tasa: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cfg-telefono">Teléfono de contacto</Label>
          <Input
            id="cfg-telefono"
            value={values.telefono_contacto}
            onChange={(e) =>
              setValues({ ...values, telefono_contacto: e.target.value })
            }
            maxLength={50}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cfg-email">Email de contacto</Label>
          <Input
            id="cfg-email"
            type="email"
            value={values.email_contacto}
            onChange={(e) =>
              setValues({ ...values, email_contacto: e.target.value })
            }
            maxLength={255}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!dirty || saving} size="sm">
          {saving ? "Guardando…" : "Guardar configuración"}
        </Button>
      </div>
    </form>
  )
}
