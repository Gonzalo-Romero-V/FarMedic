"use client"

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

import type { MovimientoRow, MovimientoTipoBackend } from "./use-stock-kardex"

type Props = {
  rows?: readonly MovimientoRow[]
  loading: boolean
}

const ROW_SKELETON_COUNT = 8
const DATETIME_FMT = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Guayaquil",
})

const TIPO_BADGE: Record<MovimientoTipoBackend, { label: string; className: string }> = {
  ingreso: {
    label: "Ingreso",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  venta: {
    label: "Venta",
    className: "border-foreground/20 bg-muted text-muted-foreground",
  },
  devolucion_cliente: {
    label: "Devol. cliente",
    className: "border-primary/40 bg-primary/10 text-primary",
  },
  devolucion_proveedor: {
    label: "Devol. proveedor",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  ajuste: {
    label: "Ajuste",
    className: "border-foreground/30 bg-foreground/5 text-foreground",
  },
  vencimiento: {
    label: "Vencimiento",
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
  perdida: {
    label: "Pérdida",
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
}

export function KardexTable({ rows, loading }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Lote</TableHead>
          <TableHead>Medicamento</TableHead>
          <TableHead className="text-right">Cantidad</TableHead>
          <TableHead>Actor</TableHead>
          <TableHead>Justificación</TableHead>
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
              Sin movimientos para los filtros actuales.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((mov) => {
            const badge = TIPO_BADGE[mov.tipo]
            const positivo = mov.cantidad > 0
            return (
              <TableRow key={mov.id}>
                <TableCell className="text-muted-foreground tabular-nums">
                  {DATETIME_FMT.format(new Date(mov.created_at))}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={badge.className}>
                    {badge.label}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{mov.lote?.numero_lote ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {mov.lote?.medicamento?.nombre_comercial ?? "—"}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums font-medium",
                    positivo ? "text-emerald-700 dark:text-emerald-300" : "text-destructive",
                  )}
                >
                  {positivo ? "+" : ""}
                  {mov.cantidad}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {mov.usuario === null ? (
                    <span className="italic">Sistema</span>
                  ) : (
                    mov.usuario?.nombre ?? "—"
                  )}
                </TableCell>
                <TableCell className="max-w-[280px] truncate text-muted-foreground">
                  {mov.justificacion ?? "—"}
                </TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )
}
