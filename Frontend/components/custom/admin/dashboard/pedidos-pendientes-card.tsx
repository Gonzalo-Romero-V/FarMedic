import { ShoppingCart } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/** Enum canónico de pedido.estado — ver vault/domain/pedido.md.
 *  El dashboard solo lista los estados "abiertos": pendiente y en_camino. */
export type PedidoEstadoAbierto = "pendiente" | "en_camino"

export type PedidoPendiente = {
  id: string
  codigo: string
  cliente: string
  /** ISO datetime */
  fecha: string
  total: number
  estado: PedidoEstadoAbierto
}

type Props = {
  items?: readonly PedidoPendiente[]
}

const ROW_SKELETON_COUNT = 4
const USD = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" })
const DATETIME_FMT = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
})

const ESTADO_BADGE: Record<PedidoEstadoAbierto, { label: string; className: string }> = {
  pendiente: {
    label: "Pendiente",
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
  en_camino: {
    label: "En camino",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
}

export function PedidosPendientesCard({ items }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-primary" aria-hidden />
          Pedidos pendientes
        </CardTitle>
        <CardDescription>Pedidos online sin entregar</CardDescription>
      </CardHeader>
      <CardContent>
        {items === undefined ? (
          <ul className="space-y-3">
            {Array.from({ length: ROW_SKELETON_COUNT }).map((_, i) => (
              <li key={i} className="flex items-center justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-4 w-16" />
              </li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground">
            No hay pedidos pendientes.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((it) => {
              const estado = ESTADO_BADGE[it.estado]
              return (
                <li key={it.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      <span className="text-muted-foreground">#{it.codigo}</span> · {it.cliente}
                    </p>
                    <p className="xs text-muted-foreground">
                      {DATETIME_FMT.format(new Date(it.fecha))}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="small tabular-nums">{USD.format(it.total)}</span>
                    <Badge variant="outline" className={estado.className}>
                      {estado.label}
                    </Badge>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
