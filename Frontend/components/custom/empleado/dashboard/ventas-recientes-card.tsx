import { Receipt } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import type { VentaRecienteItem } from "./use-empleado-dashboard"

type Props = {
  items?: readonly VentaRecienteItem[]
}

const TIME_FMT = new Intl.DateTimeFormat("es-EC", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Guayaquil",
})

const USD = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" })

const ROW_SKELETON_COUNT = 4

export function VentasRecientesCard({ items }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" aria-hidden />
          Ventas del día
        </CardTitle>
        <CardDescription>Últimas operaciones registradas en tu sucursal</CardDescription>
      </CardHeader>
      <CardContent>
        {items === undefined ? (
          <ul className="space-y-3">
            {Array.from({ length: ROW_SKELETON_COUNT }).map((_, i) => (
              <li key={i} className="flex items-center justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16" />
              </li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground">
            Aún no hay ventas registradas hoy.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-xs text-muted-foreground">
                      {it.numeroComprobante}
                    </span>
                    {it.estado === "anulada" && (
                      <Badge
                        variant="outline"
                        className="border-destructive/40 text-destructive"
                      >
                        anulada
                      </Badge>
                    )}
                  </p>
                  <p className="xs text-muted-foreground">
                    {it.cliente} · {TIME_FMT.format(new Date(it.fecha))} ·{" "}
                    <span className="capitalize">{it.metodoPago}</span>
                  </p>
                </div>
                <span className="tabular-nums text-sm font-medium">
                  {USD.format(it.total)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
