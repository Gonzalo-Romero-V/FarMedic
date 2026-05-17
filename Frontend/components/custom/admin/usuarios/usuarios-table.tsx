"use client"

import { Pencil, Power, Shield } from "lucide-react"

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

import { RolBadge } from "./rol-badge"
import type { UsuarioRow } from "./use-admin-usuarios"

type Props = {
  rows?: readonly UsuarioRow[]
  loading: boolean
  onEdit: (u: UsuarioRow) => void
  onToggle: (u: UsuarioRow) => void
  onCambiarRol: (u: UsuarioRow) => void
}

const ROW_SKELETON_COUNT = 8

export function UsuariosTable({ rows, loading, onEdit, onToggle, onCambiarRol }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Sucursal</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="w-32" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          Array.from({ length: ROW_SKELETON_COUNT }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: 6 }).map((__, j) => (
                <TableCell key={j}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : !rows || rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
              Sin usuarios para los filtros actuales.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.nombre}</TableCell>
              <TableCell className="text-muted-foreground">{u.email}</TableCell>
              <TableCell>
                {u.rol ? <RolBadge rol={u.rol.nombre} /> : <span className="xs">—</span>}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {u.sucursal ? `${u.sucursal.nombre} · ${u.sucursal.ciudad}` : "—"}
              </TableCell>
              <TableCell>
                {u.activo ? (
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-700">
                    Activo
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-foreground/20 bg-muted text-muted-foreground"
                  >
                    Inactivo
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onCambiarRol(u)}
                    aria-label={`Cambiar rol de ${u.nombre}`}
                  >
                    <Shield className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(u)}
                    aria-label={`Editar ${u.nombre}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggle(u)}
                    aria-label={u.activo ? "Desactivar" : "Reactivar"}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
