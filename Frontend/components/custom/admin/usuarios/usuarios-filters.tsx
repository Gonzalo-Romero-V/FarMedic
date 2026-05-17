"use client"

import { Search } from "lucide-react"

import { useAdminLookups } from "@/components/custom/admin/_shared/use-lookups"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

import type { RolNombre, UsuariosFilters } from "./use-admin-usuarios"

type Props = {
  filters: UsuariosFilters
  onChange: (next: UsuariosFilters) => void
}

const TODOS = "__todos__"

export function UsuariosFiltersBar({ filters, onChange }: Props) {
  const lookups = useAdminLookups()
  const sucursales = lookups.status === "ready" ? lookups.sucursales : []
  const patch = (n: Partial<UsuariosFilters>) => onChange({ ...filters, ...n })

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex-1 min-w-[220px] space-y-1.5">
        <Label htmlFor="usr-q" className="xs uppercase tracking-wide text-muted-foreground">
          Buscar
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="usr-q"
            placeholder="Nombre o email"
            value={filters.q ?? ""}
            onChange={(e) => patch({ q: e.target.value })}
            className="pl-8"
          />
        </div>
      </div>

      <div className="min-w-[180px] space-y-1.5">
        <Label className="xs uppercase tracking-wide text-muted-foreground">Rol</Label>
        <Select
          value={filters.rol ?? TODOS}
          onValueChange={(v) =>
            patch({ rol: v === TODOS ? undefined : (v as RolNombre) })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos</SelectItem>
            <SelectItem value="administrador">Administrador</SelectItem>
            <SelectItem value="empleado">Empleado</SelectItem>
            <SelectItem value="cliente">Cliente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[200px] space-y-1.5">
        <Label className="xs uppercase tracking-wide text-muted-foreground">Sucursal</Label>
        <Select
          value={filters.sucursalId ? String(filters.sucursalId) : TODOS}
          onValueChange={(v) =>
            patch({ sucursalId: v === TODOS ? undefined : Number(v) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todas</SelectItem>
            {sucursales.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 sm:pb-2">
        <Switch
          id="solo-activos"
          checked={filters.soloActivos}
          onCheckedChange={(v) => patch({ soloActivos: v })}
        />
        <Label htmlFor="solo-activos" className="small">
          Solo activos
        </Label>
      </div>
    </div>
  )
}
