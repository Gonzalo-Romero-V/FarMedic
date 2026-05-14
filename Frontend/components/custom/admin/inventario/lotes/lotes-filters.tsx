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
import type { LoteEstado } from "../_shared/lote-estado-badge"
import type { LotesFilters } from "./use-admin-lotes"

type Props = {
  filters: LotesFilters
  sucursales: LookupOption[]
  onChange: (next: LotesFilters) => void
}

const ESTADO_OPTIONS: { value: LoteEstado | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "vigente", label: "Vigentes" },
  { value: "proximo_a_vencer", label: "Próximos a vencer" },
  { value: "vencido", label: "Vencidos" },
]

export function LotesFiltersBar({ filters, sucursales, onChange }: Props) {
  const patch = (next: Partial<LotesFilters>) =>
    onChange({ ...filters, page: 1, ...next })

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex-1 min-w-[200px] space-y-1.5">
        <Label htmlFor="lote-q" className="xs uppercase tracking-wide text-muted-foreground">
          Buscar
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="lote-q"
            placeholder="Lote, medicamento o principio activo"
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
            {ESTADO_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 sm:pb-2">
        <Switch
          id="solo-con-stock"
          checked={!!filters.soloConStock}
          onCheckedChange={(v) => patch({ soloConStock: v })}
        />
        <Label htmlFor="solo-con-stock" className="small">
          Solo con stock
        </Label>
      </div>
    </div>
  )
}
