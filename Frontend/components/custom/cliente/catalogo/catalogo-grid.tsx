"use client"

import { Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import type { CatalogoMedicamento } from "./use-catalogo"

type Props = {
  items?: readonly CatalogoMedicamento[]
  loading: boolean
  onAdd: (med: CatalogoMedicamento) => void
}

const USD = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" })
const SKELETON_COUNT = 8

export function CatalogoGrid({ items, loading, onAdd }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full" />
        ))}
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="rounded-md border bg-card p-8 text-center text-sm text-muted-foreground">
        Sin medicamentos disponibles para los filtros actuales.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((med) => (
        <Card key={med.id} size="sm" className="flex flex-col">
          <CardContent className="flex flex-1 flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold">{med.nombre_comercial}</h3>
                <p className="xs text-muted-foreground">{med.principio_activo}</p>
              </div>
              {med.requiere_receta && (
                <Badge variant="outline" className="border-amber-300 text-amber-700">
                  Receta
                </Badge>
              )}
            </div>

            <div className="xs text-muted-foreground">{med.categoria_nombre}</div>

            <div className="mt-auto flex items-end justify-between gap-2 pt-2">
              <div className="flex flex-col">
                <span className="h3 tabular-nums">{USD.format(Number(med.precio))}</span>
                <span className="xs text-muted-foreground">
                  Stock {med.stock_disponible}
                </span>
              </div>
              <Button size="sm" onClick={() => onAdd(med)} disabled={med.stock_disponible <= 0}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Agregar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
