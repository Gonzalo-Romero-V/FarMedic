"use client"

import { AlertTriangle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

import type { StockMedicamentoRow } from "./use-stock-inventario"

type Props = {
  rows?: readonly StockMedicamentoRow[]
  loading: boolean
}

const ROW_SKELETON_COUNT = 8
const USD = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" })

export function InventarioTable({ rows, loading }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Medicamento</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Ubicación</TableHead>
          <TableHead className="text-right">Precio</TableHead>
          <TableHead className="text-right">Stock</TableHead>
          <TableHead className="text-right">Mínimo</TableHead>
          <TableHead>Lotes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          Array.from({ length: ROW_SKELETON_COUNT }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: 7 }).map((__, j) => (
                <TableCell key={j}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : !rows || rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
              Sin medicamentos para los filtros actuales.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((med) => {
            const critico = med.stock_actual < med.stock_minimo
            return (
              <TableRow key={med.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{med.nombre_comercial}</span>
                    <span className="xs text-muted-foreground">
                      {med.principio_activo}
                      {med.codigo_barras && (
                        <>
                          {" · "}
                          <span className="font-mono">{med.codigo_barras}</span>
                        </>
                      )}
                    </span>
                  </div>
                  {med.requiere_receta && (
                    <Badge
                      variant="outline"
                      className="mt-1 border-amber-300 text-amber-700"
                    >
                      Receta
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{med.categoria_nombre}</TableCell>
                <TableCell className="text-muted-foreground">
                  {med.ubicacion_fisica || "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {USD.format(Number(med.precio))}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums font-medium",
                    critico && "text-destructive",
                  )}
                >
                  <span className="inline-flex items-center justify-end gap-1.5">
                    {critico && <AlertTriangle className="h-3.5 w-3.5" aria-hidden />}
                    {med.stock_actual}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {med.stock_minimo}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className="border-foreground/20 bg-muted text-muted-foreground"
                    >
                      {med.lotes_vigentes_count} vigentes
                    </Badge>
                    {med.lotes_por_vencer_count > 0 && (
                      <Badge
                        variant="outline"
                        className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      >
                        {med.lotes_por_vencer_count} por vencer
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )
}
