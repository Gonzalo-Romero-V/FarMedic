"use client"

import { Pencil } from "lucide-react"

import { LoteEstadoBadge } from "@/components/custom/admin/inventario/_shared/lote-estado-badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { LoteRow } from "./use-stock-lotes"

type Props = {
  rows?: readonly LoteRow[]
  loading: boolean
  onEdit: (lote: LoteRow) => void
}

const ROW_SKELETON_COUNT = 8
const DATE_FMT = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})
const USD = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" })

export function LotesTable({ rows, loading, onEdit }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Lote</TableHead>
          <TableHead>Medicamento</TableHead>
          <TableHead>Proveedor</TableHead>
          <TableHead className="text-right">Stock</TableHead>
          <TableHead className="text-right">Costo unit.</TableHead>
          <TableHead>Vencimiento</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          Array.from({ length: ROW_SKELETON_COUNT }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: 8 }).map((__, j) => (
                <TableCell key={j}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : !rows || rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
              Sin lotes para los filtros actuales.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((lote) => (
            <TableRow key={lote.id}>
              <TableCell className="font-medium">{lote.numero_lote}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {lote.medicamento?.nombre_comercial ?? "—"}
                  </span>
                  <span className="xs text-muted-foreground">
                    {lote.medicamento?.principio_activo}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {lote.proveedor?.nombre ?? "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">{lote.cantidad_actual}</TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {USD.format(Number(lote.costo_unitario))}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {DATE_FMT.format(new Date(lote.fecha_vencimiento))}
              </TableCell>
              <TableCell>
                <LoteEstadoBadge fechaVencimiento={lote.fecha_vencimiento} />
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(lote)}
                  aria-label={`Editar lote ${lote.numero_lote}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
