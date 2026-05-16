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

import type { LookupOption } from "../../_shared/use-empleado-lookups"
import type { StockFilters } from "./use-stock-inventario"

type Props = {
  filters: StockFilters
  categorias: LookupOption[]
  onChange: (next: StockFilters) => void
}

export function InventarioFiltersBar({ filters, categorias, onChange }: Props) {
  const patch = (n: Partial<StockFilters>) => onChange({ ...filters, page: 1, ...n })

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex-1 min-w-[220px] space-y-1.5">
        <Label htmlFor="stock-q" className="xs uppercase tracking-wide text-muted-foreground">
          Buscar
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="stock-q"
            placeholder="Nombre, principio activo o código de barras"
            value={filters.q ?? ""}
            onChange={(e) => patch({ q: e.target.value })}
            className="pl-8"
          />
        </div>
      </div>

      <div className="min-w-[180px] space-y-1.5">
        <Label className="xs uppercase tracking-wide text-muted-foreground">Categoría</Label>
        <Select
          value={filters.categoriaId ? String(filters.categoriaId) : "todas"}
          onValueChange={(v) => patch({ categoriaId: v === "todas" ? undefined : Number(v) })}
        >
          <SelectTrigger>
            <SelectValue />
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
          id="solo-critico"
          checked={!!filters.soloCritico}
          onCheckedChange={(v) => patch({ soloCritico: v })}
        />
        <Label htmlFor="solo-critico" className="small">
          Solo stock crítico
        </Label>
      </div>
    </div>
  )
}
