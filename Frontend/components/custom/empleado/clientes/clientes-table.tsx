"use client"

import { History } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import type { ClienteRow } from "./use-empleado-clientes"

type Props = {
  data: ClienteRow[]
  loading?: boolean
  onView: (id: number) => void
}

const DATE_FMT = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

export function ClientesTable({ data, loading, onView }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-md border bg-card p-8 text-center text-sm text-muted-foreground">
        Sin clientes registrados para los filtros actuales.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">Nombre</th>
            <th className="px-3 py-2 text-left">Email</th>
            <th className="px-3 py-2 text-right">Ventas</th>
            <th className="px-3 py-2 text-right">Pedidos</th>
            <th className="px-3 py-2 text-left">Alta</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((c) => (
            <tr key={c.id} className="border-t hover:bg-muted/30">
              <td className="px-3 py-2 font-medium">{c.nombre}</td>
              <td className="px-3 py-2 text-muted-foreground">{c.email}</td>
              <td className="px-3 py-2 text-right tabular-nums">
                {c.ventas_count > 0 ? (
                  <Badge variant="outline">{c.ventas_count}</Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {c.pedidos_count > 0 ? (
                  <Badge variant="outline">{c.pedidos_count}</Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {DATE_FMT.format(new Date(c.created_at))}
              </td>
              <td className="px-3 py-2 text-right">
                <Button variant="ghost" size="sm" onClick={() => onView(c.id)}>
                  <History className="mr-1 h-3.5 w-3.5" />
                  Historial
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
