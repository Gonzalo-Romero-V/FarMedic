"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type {
  KardexFilters,
  MovimientoTipoBackend,
} from "./use-stock-kardex"

type Props = {
  filters: KardexFilters
  onChange: (next: KardexFilters) => void
}

const TIPO_OPTIONS: { value: MovimientoTipoBackend | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "ingreso", label: "Ingreso (auto)" },
  { value: "venta", label: "Venta (auto)" },
  { value: "devolucion_cliente", label: "Devolución cliente" },
  { value: "devolucion_proveedor", label: "Devolución proveedor" },
  { value: "vencimiento", label: "Vencimiento" },
  { value: "perdida", label: "Pérdida" },
  { value: "ajuste", label: "Ajuste (admin)" },
]

export function KardexFiltersBar({ filters, onChange }: Props) {
  const patch = (n: Partial<KardexFilters>) => onChange({ ...filters, page: 1, ...n })

  return (
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
  )
}
