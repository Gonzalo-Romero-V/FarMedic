"use client"

import { Eye, House, Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { PedidoEstadoBadge } from "./pedido-estado-badge"
import type { PedidoRow } from "./use-empleado-pedidos"

const DATE_FMT = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Guayaquil",
})

const USD = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" })

function asNum(v: string | number): number {
  return typeof v === "number" ? v : Number(v)
}

type Props = {
  data: PedidoRow[]
  loading: boolean
  onView: (id: number) => void
}

export function PedidosTable({ data, loading, onView }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-md border bg-card p-8 text-center text-sm text-muted-foreground">
        No hay pedidos para los filtros seleccionados.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">N°</th>
            <th className="px-3 py-2 text-left">Cliente</th>
            <th className="px-3 py-2 text-left">Sucursal</th>
            <th className="px-3 py-2 text-left">Entrega</th>
            <th className="px-3 py-2 text-left">Fecha</th>
            <th className="px-3 py-2 text-left">Estado</th>
            <th className="px-3 py-2 text-right">Total</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="px-3 py-2 font-mono text-xs">{p.numero_pedido}</td>
              <td className="px-3 py-2">{p.cliente?.nombre ?? `#${p.cliente_id}`}</td>
              <td className="px-3 py-2">{p.sucursal?.nombre ?? `#${p.sucursal_id}`}</td>
              <td className="px-3 py-2">
                {p.tipo_entrega === "domicilio" ? (
                  <span className="inline-flex items-center gap-1">
                    <Truck className="h-3 w-3" /> Envío
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <House className="h-3 w-3" /> Retiro
                  </span>
                )}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                {DATE_FMT.format(new Date(p.fecha_solicitud))}
              </td>
              <td className="px-3 py-2">
                <PedidoEstadoBadge estado={p.estado} />
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {USD.format(asNum(p.total))}
              </td>
              <td className="px-3 py-2 text-right">
                <Button variant="ghost" size="sm" onClick={() => onView(p.id)}>
                  <Eye className="mr-1 h-3.5 w-3.5" />
                  Gestionar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
