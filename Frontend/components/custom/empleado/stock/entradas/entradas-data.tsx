"use client"

import { useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

import { useEmpleadoLookups } from "../../_shared/use-empleado-lookups"
import { KardexTable } from "../kardex/kardex-table"
import { useStockKardex, type KardexFilters } from "../kardex/use-stock-kardex"
import { LoteAltaSheet } from "../lotes/lote-alta-sheet"

/**
 * Vista filtrada del Kardex por tipo `ingreso`. El acceso rápido a "Recibir lote"
 * reusa el sheet de alta de lotes — al crear un lote nuevo, el LoteController
 * dispara automáticamente el movimiento `ingreso` correspondiente.
 */
export function EntradasData() {
  const { user } = useAuth()
  const [filters, setFilters] = useState<KardexFilters>({
    page: 1,
    perPage: 25,
    tipo: "ingreso",
  })

  const lookups = useEmpleadoLookups()
  const state = useStockKardex(filters, user?.sucursal_id ?? null)

  const medicamentos = lookups.status === "ready" ? lookups.medicamentos : []
  const proveedores = lookups.status === "ready" ? lookups.proveedores : []
  const data = state.status === "ready" ? state.data : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Recepciones de proveedor registradas en tu sucursal.
        </p>
        <LoteAltaSheet
          medicamentos={medicamentos}
          proveedores={proveedores}
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
