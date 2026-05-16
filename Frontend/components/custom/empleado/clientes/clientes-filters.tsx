"use client"

import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"

import type { ClientesFilters } from "./use-empleado-clientes"

type Props = {
  filters: ClientesFilters
  onChange: (filters: ClientesFilters) => void
}

export function ClientesFiltersBar({ filters, onChange }: Props) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Buscar por nombre o email..."
        value={filters.q ?? ""}
        onChange={(e) => onChange({ ...filters, q: e.target.value || undefined, page: 1 })}
        className="pl-9 max-w-md"
      />
    </div>
  )
}
