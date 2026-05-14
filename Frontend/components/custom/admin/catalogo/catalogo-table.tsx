"use client"

import { Pencil, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
import { cn } from "@/lib/utils"

import type { MedicamentoRow } from "./use-admin-catalogo"

type Props = {
  rows?: readonly MedicamentoRow[]
  loading: boolean
  onEdit: (med: MedicamentoRow) => void
  onDelete: (med: MedicamentoRow) => void
}

const ROW_SKELETON_COUNT = 8
const USD = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" })

export function CatalogoTable({ rows, loading, onEdit, onDelete }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Medicamento</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Proveedor</TableHead>
          <TableHead className="text-right">Precio</TableHead>
          <TableHead className="text-right">Stock mín.</TableHead>
          <TableHead>Código barras</TableHead>
          <TableHead>Ubicación</TableHead>
          <TableHead>Flags</TableHead>
          <TableHead className="w-20" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading
          ? Array.from({ length: ROW_SKELETON_COUNT }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 9 }).map((__, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          : !rows || rows.length === 0
            ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    No se encontraron medicamentos con los filtros actuales.
                  </TableCell>
                </TableRow>
              )
            : rows.map((med) => (
                <TableRow key={med.id} className={cn(!med.activo && "opacity-60")}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{med.nombre_comercial}</span>
                      <span className="xs text-muted-foreground">{med.principio_activo}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {med.categoria?.nombre ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {med.proveedor?.nombre ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {USD.format(Number(med.precio))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {med.stock_minimo}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {med.codigo_barras ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {med.ubicacion_fisica}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {med.requiere_receta && (
                        <Badge
                          variant="outline"
                          className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        >
                          Receta
                        </Badge>
                      )}
                      {!med.activo && (
                        <Badge
                          variant="outline"
                          className="border-foreground/20 bg-muted text-muted-foreground"
                        >
                          Inactivo
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(med)}
                        aria-label={`Editar ${med.nombre_comercial}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(med)}
                        aria-label={`Eliminar ${med.nombre_comercial}`}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
      </TableBody>
    </Table>
  )
}
