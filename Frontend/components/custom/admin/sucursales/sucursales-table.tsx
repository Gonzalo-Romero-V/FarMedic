"use client"

import { MapPin, Pencil, Power } from "lucide-react"

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

import type { SucursalRow } from "./use-admin-sucursales"

type Props = {
  rows?: readonly SucursalRow[]
  loading: boolean
  onEdit: (s: SucursalRow) => void
  onToggle: (s: SucursalRow) => void
}

const ROW_SKELETON_COUNT = 6

export function SucursalesTable({ rows, loading, onEdit, onToggle }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Ciudad</TableHead>
          <TableHead>Dirección</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead>Geo</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="w-24" />
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
              Sin sucursales para los filtros actuales.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((s) => {
            const tieneGeo = s.latitud !== null && s.longitud !== null
            return (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.nombre}</TableCell>
                <TableCell className="text-muted-foreground">{s.ciudad}</TableCell>
                <TableCell className="text-muted-foreground max-w-[280px] truncate">
                  {s.direccion}
                </TableCell>
                <TableCell className="text-muted-foreground">{s.telefono}</TableCell>
                <TableCell>
                  {tieneGeo ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    >
                      <MapPin className="mr-1 h-3 w-3" />
                      Geo
                    </Badge>
                  ) : (
                    <span className="xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {s.activa ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/40 text-emerald-700"
                    >
                      Activa
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-foreground/20 bg-muted text-muted-foreground"
                    >
                      Inactiva
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(s)}
                      aria-label={`Editar ${s.nombre}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggle(s)}
                      aria-label={s.activa ? "Desactivar" : "Reactivar"}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
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
