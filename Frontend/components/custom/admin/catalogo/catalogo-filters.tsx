"use client"

import { Search } from "lucide-react"

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

import type { LookupOption } from "../_shared/use-lookups"
import type { CatalogoFilters } from "./use-admin-catalogo"

type Props = {
  filters: CatalogoFilters
  sucursales: LookupOption[]
  categorias: LookupOption[]
  onChange: (next: CatalogoFilters) => void
}

export function CatalogoFiltersBar({ filters, sucursales, categorias, onChange }: Props) {
  const patch = (next: Partial<CatalogoFilters>) =>
    onChange({ ...filters, page: 1, ...next })

  // Por defecto el backend filtra solo activos; el toggle "Incluir inactivos" desactiva ese filtro.
  const incluirInactivos = filters.soloActivos === false

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex-1 min-w-[220px] space-y-1.5">
        <Label htmlFor="cat-q" className="xs uppercase tracking-wide text-muted-foreground">
          Buscar
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="cat-q"
            placeholder="Nombre, principio activo o código de barras"
            value={filters.q ?? ""}
            onChange={(e) => patch({ q: e.target.value })}
            className="pl-8"
          />
        </div>
      </div>

      <div className="min-w-[180px] space-y-1.5">
        <Label className="xs uppercase tracking-wide text-muted-foreground">Sucursal</Label>
        <Select
          value={filters.sucursalId ? String(filters.sucursalId) : "todas"}
          onValueChange={(v) => patch({ sucursalId: v === "todas" ? undefined : Number(v) })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {sucursales.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[180px] space-y-1.5">
        <Label className="xs uppercase tracking-wide text-muted-foreground">Categoría</Label>
        <Select
          value={filters.categoriaId ? String(filters.categoriaId) : "todas"}
          onValueChange={(v) => patch({ categoriaId: v === "todas" ? undefined : Number(v) })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 sm:pb-2">
        <Switch
          id="incluir-inactivos"
          checked={incluirInactivos}
          onCheckedChange={(v) => patch({ soloActivos: v ? false : undefined })}
        />
        <Label htmlFor="incluir-inactivos" className="small">
          Incluir inactivos
        </Label>
      </div>
    </div>
  )
}
