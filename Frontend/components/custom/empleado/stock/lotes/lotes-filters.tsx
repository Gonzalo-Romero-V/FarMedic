"use client"

import { Search } from "lucide-react"

import type { LoteEstado } from "@/components/custom/admin/inventario/_shared/lote-estado-badge"
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

import type { LotesFilters } from "./use-stock-lotes"

type Props = {
  filters: LotesFilters
  onChange: (next: LotesFilters) => void
}

export function LotesFiltersBar({ filters, onChange }: Props) {
  const patch = (n: Partial<LotesFilters>) => onChange({ ...filters, page: 1, ...n })

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex-1 min-w-[220px] space-y-1.5">
        <Label htmlFor="lote-q" className="xs uppercase tracking-wide text-muted-foreground">
          Buscar
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="lote-q"
            placeholder="Lote, nombre o principio activo"
            value={filters.q ?? ""}
            onChange={(e) => patch({ q: e.target.value })}
            className="pl-8"
          />
        </div>
      </div>

      <div className="min-w-[180px] space-y-1.5">
        <Label className="xs uppercase tracking-wide text-muted-foreground">Estado</Label>
        <Select
          value={filters.estado ?? "todos"}
          onValueChange={(v) =>
            patch({ estado: v === "todos" ? undefined : (v as LoteEstado) })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="vigente">Vigente</SelectItem>
            <SelectItem value="proximo_a_vencer">Próximo a vencer</SelectItem>
            <SelectItem value="vencido">Vencido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 sm:pb-2">
        <Switch
          id="solo-stock"
          checked={!!filters.soloConStock}
          onCheckedChange={(v) => patch({ soloConStock: v })}
        />
        <Label htmlFor="solo-stock" className="small">
          Solo con stock
        </Label>
      </div>
    </div>
  )
}
