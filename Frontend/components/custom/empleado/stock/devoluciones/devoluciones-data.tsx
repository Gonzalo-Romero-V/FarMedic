"use client"

import { useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useAuth } from "@/hooks/use-auth"

import { useEmpleadoLookups } from "../../_shared/use-empleado-lookups"
import { KardexTable } from "../kardex/kardex-table"
import { MovimientoAltaDialog } from "../kardex/movimiento-alta-dialog"
import {
  useStockKardex,
  type KardexFilters,
  type MovimientoTipoBackend,
} from "../kardex/use-stock-kardex"

type DevolucionTipo = Extract<
  MovimientoTipoBackend,
  "devolucion_cliente" | "devolucion_proveedor"
>

/**
 * Devoluciones: vista filtrada del Kardex por movimientos `devolucion_*` y acceso
 * al diálogo de alta de movimiento (compartido con kardex). El backend acepta un
 * `tipo` por request, así que el switch alterna entre los dos sub-tipos.
 */
export function DevolucionesData() {
  const { user } = useAuth()
  const [tipo, setTipo] = useState<DevolucionTipo>("devolucion_cliente")
  const [filters, setFilters] = useState<KardexFilters>({
    page: 1,
    perPage: 25,
    tipo: "devolucion_cliente",
  })

  const lookups = useEmpleadoLookups()
  const state = useStockKardex(filters, user?.sucursal_id ?? null)

  const medicamentos = lookups.status === "ready" ? lookups.medicamentos : []
  const data = state.status === "ready" ? state.data : null

  const handleTipoChange = (v: string) => {
    const next = v as DevolucionTipo
    setTipo(next)
    setFilters({ ...filters, tipo: next, page: 1 })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Label className="xs uppercase tracking-wide text-muted-foreground">
            Tipo de devolución
          </Label>
          <RadioGroup
            value={tipo}
            onValueChange={handleTipoChange}
            className="flex flex-row gap-2"
          >
            <label className="flex cursor-pointer items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-accent">
              <RadioGroupItem value="devolucion_cliente" />
              De cliente (+)
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm hover:bg-accent">
              <RadioGroupItem value="devolucion_proveedor" />
              A proveedor (−)
            </label>
          </RadioGroup>
        </div>
        <MovimientoAltaDialog
          medicamentos={medicamentos}
          onCreated={() => setFilters((f) => ({ ...f, page: 1 }))}
        />
      </div>

      {state.status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="overflow-hidden rounded-md border bg-card">
        <KardexTable rows={data?.data} loading={state.status === "loading"} />
      </div>

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {data.from ?? 0}-{data.to ?? 0} de {data.total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.current_page <= 1}
              onClick={() => setFilters({ ...filters, page: data.current_page - 1 })}
            >
              Anterior
            </Button>
            <span className="text-xs text-muted-foreground">
              Página {data.current_page} de {data.last_page}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={data.current_page >= data.last_page}
              onClick={() => setFilters({ ...filters, page: data.current_page + 1 })}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
