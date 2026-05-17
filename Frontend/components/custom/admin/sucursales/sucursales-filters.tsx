"use client"

import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

import type { SucursalesFilters } from "./use-admin-sucursales"

type Props = {
  filters: SucursalesFilters
  onChange: (next: SucursalesFilters) => void
}

export function SucursalesFiltersBar({ filters, onChange }: Props) {
  const patch = (n: Partial<SucursalesFilters>) => onChange({ ...filters, ...n })

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex-1 min-w-[220px] space-y-1.5">
        <Label htmlFor="suc-q" className="xs uppercase tracking-wide text-muted-foreground">
          Buscar
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="suc-q"
            placeholder="Nombre, ciudad o dirección"
            value={filters.q ?? ""}
            onChange={(e) => patch({ q: e.target.value })}
            className="pl-8"
          />
        </div>
      </div>

      <div className="min-w-[180px] space-y-1.5">
        <Label htmlFor="suc-ciudad" className="xs uppercase tracking-wide text-muted-foreground">
          Ciudad
        </Label>
        <Input
          id="suc-ciudad"
          placeholder="Filtrar por ciudad"
          value={filters.ciudad ?? ""}
          onChange={(e) => patch({ ciudad: e.target.value || undefined })}
        />
      </div>

      <div className="flex items-center gap-2 sm:pb-2">
        <Switch
          id="solo-activas"
          checked={filters.soloActivas}
          onCheckedChange={(v) => patch({ soloActivas: v })}
        />
        <Label htmlFor="solo-activas" className="small">
          Solo activas
        </Label>
      </div>
    </div>
  )
}
