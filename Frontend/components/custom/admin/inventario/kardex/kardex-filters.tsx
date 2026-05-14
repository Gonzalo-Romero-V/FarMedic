"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { LookupOption } from "../_shared/use-lookups"
import type { KardexFilters, MovimientoTipoBackend } from "./use-admin-kardex"

type Props = {
  filters: KardexFilters
  sucursales: LookupOption[]
  onChange: (next: KardexFilters) => void
}

const TIPO_OPTIONS: { value: MovimientoTipoBackend | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "ingreso", label: "Ingreso (auto)" },
  { value: "venta", label: "Venta (auto)" },
  { value: "devolucion_cliente", label: "Devolución cliente" },
  { value: "devolucion_proveedor", label: "Devolución proveedor" },
  { value: "ajuste", label: "Ajuste" },
  { value: "perdida", label: "Pérdida" },
  { value: "vencimiento", label: "Vencimiento" },
]

export function KardexFiltersBar({ filters, sucursales, onChange }: Props) {
  const patch = (next: Partial<KardexFilters>) =>
    onChange({ ...filters, page: 1, ...next })

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="min-w-[200px] space-y-1.5">
        <Label className="xs uppercase tracking-wide text-muted-foreground">Tipo</Label>
        <Select
          value={filters.tipo ?? "todos"}
          onValueChange={(v) =>
            patch({ tipo: v === "todos" ? undefined : (v as MovimientoTipoBackend) })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIPO_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[200px] space-y-1.5">
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
    </div>
  )
}
