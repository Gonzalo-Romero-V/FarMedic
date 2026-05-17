"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { PedidoEstado, PedidosFilters } from "./use-empleado-pedidos"

const TODOS = "__todos__"

type Props = {
  filters: PedidosFilters
  onChange: (next: PedidosFilters) => void
}

export function PedidosFiltersBar({ filters, onChange }: Props) {
  return (
    <div className="flex items-end gap-3">
      <div className="min-w-[180px] space-y-1.5">
        <Label className="xs uppercase tracking-wide text-muted-foreground">Estado</Label>
        <Select
          value={filters.estado ?? TODOS}
          onValueChange={(v) =>
            onChange({
              ...filters,
              estado: v === TODOS ? undefined : (v as PedidoEstado),
              page: 1,
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en_camino">En camino</SelectItem>
            <SelectItem value="entregado">Entregado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
