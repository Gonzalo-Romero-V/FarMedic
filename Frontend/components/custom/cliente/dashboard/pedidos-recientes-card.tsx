import { Package } from "lucide-react"
import Link from "next/link"

import { PedidoEstadoBadge } from "@/components/custom/cliente/pedidos/pedido-estado-badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import type { PedidoRecienteItem } from "./use-cliente-dashboard"

type Props = {
  items?: readonly PedidoRecienteItem[]
}

const DATE_FMT = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

const USD = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" })

const SKELETON_COUNT = 4

export function PedidosRecientesCard({ items }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" aria-hidden />
          Pedidos recientes
        </CardTitle>
        <CardDescription>Tus últimas órdenes</CardDescription>
      </CardHeader>
      <CardContent>
        {items === undefined ? (
          <ul className="space-y-3">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
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
            Aún no hiciste pedidos. <Link href="/cliente/catalogo" className="text-primary underline">Explora el catálogo</Link>.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/cliente/pedidos/${p.id}`}
                  className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0 hover:bg-accent/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-xs text-muted-foreground">
                        {p.numeroPedido}
                      </span>
                      <PedidoEstadoBadge estado={p.estado} />
                    </div>
                    <div className="xs text-muted-foreground">
                      {p.sucursalNombre} · {DATE_FMT.format(new Date(p.fechaSolicitud))}
                    </div>
                  </div>
                  <span className="tabular-nums text-sm font-medium">
                    {USD.format(p.total)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
