"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type {
  MetodoPagoFiltro,
  VentaEstado,
  VentasFilters,
} from "./use-empleado-ventas"

type Props = {
  filters: VentasFilters
  onChange: (filters: VentasFilters) => void
}

const TODOS = "__todos__"

export function VentasFiltersBar({ filters, onChange }: Props) {
  const update = (patch: Partial<VentasFilters>) => onChange({ ...filters, ...patch, page: 1 })

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Desde</Label>
        <Input
          type="date"
          value={filters.desde ?? ""}
          onChange={(e) => update({ desde: e.target.value || undefined })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Hasta</Label>
        <Input
          type="date"
          value={filters.hasta ?? ""}
          onChange={(e) => update({ hasta: e.target.value || undefined })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Estado</Label>
        <Select
          value={filters.estado ?? TODOS}
          onValueChange={(v) => update({ estado: v === TODOS ? undefined : (v as VentaEstado) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos</SelectItem>
            <SelectItem value="completada">Completada</SelectItem>
            <SelectItem value="anulada">Anulada</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Método de pago</Label>
        <Select
          value={filters.metodoPago ?? TODOS}
          onValueChange={(v) =>
            update({ metodoPago: v === TODOS ? undefined : (v as MetodoPagoFiltro) })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos</SelectItem>
            <SelectItem value="efectivo">Efectivo</SelectItem>
            <SelectItem value="tarjeta">Tarjeta</SelectItem>
            <SelectItem value="transferencia">Transferencia</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
