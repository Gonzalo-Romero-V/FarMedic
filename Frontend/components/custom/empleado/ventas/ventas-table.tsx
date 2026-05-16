"use client"

import { Eye } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import type { VentaResponse } from "../pos/use-pos"

type Props = {
  data: VentaResponse[]
  loading?: boolean
  onView: (id: number) => void
}

function fmtFecha(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString("es-EC", { timeZone: "America/Guayaquil" })
}

function asNum(v: string | number): number {
  return typeof v === "number" ? v : Number(v)
}

export function VentasTable({ data, loading, onView }: Props) {
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
        Sin ventas para los filtros actuales.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">Comprobante</th>
            <th className="px-3 py-2 text-left">Fecha</th>
            <th className="px-3 py-2 text-left">Cliente</th>
            <th className="px-3 py-2 text-left">Método</th>
            <th className="px-3 py-2 text-right">Total</th>
            <th className="px-3 py-2 text-left">Estado</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((v) => (
            <tr key={v.id} className="border-t hover:bg-muted/30">
              <td className="px-3 py-2 font-mono text-xs">{v.numero_comprobante}</td>
              <td className="px-3 py-2 whitespace-nowrap">{fmtFecha(v.fecha)}</td>
              <td className="px-3 py-2">{v.cliente?.nombre ?? "Consumidor final"}</td>
              <td className="px-3 py-2 capitalize">{v.metodo_pago}</td>
              <td className="px-3 py-2 text-right tabular-nums">
                ${asNum(v.total).toFixed(2)}
              </td>
              <td className="px-3 py-2">
                <Badge
                  variant="outline"
                  className={
                    v.estado === "anulada"
                      ? "border-destructive/40 text-destructive"
                      : "border-emerald-300 text-emerald-700"
                  }
                >
                  {v.estado}
                </Badge>
              </td>
              <td className="px-3 py-2 text-right">
                <Button variant="ghost" size="sm" onClick={() => onView(v.id)}>
                  <Eye className="mr-1 h-3.5 w-3.5" />
                  Ver
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
