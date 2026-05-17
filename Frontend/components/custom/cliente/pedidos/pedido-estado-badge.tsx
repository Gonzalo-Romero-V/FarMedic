import { Badge } from "@/components/ui/badge"

import type { PedidoEstado } from "./use-cliente-pedidos"

const STYLE: Record<PedidoEstado, { label: string; className: string }> = {
  pendiente: {
    label: "Pendiente",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  en_camino: {
    label: "En camino",
    className: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  entregado: {
    label: "Entregado",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  cancelado: {
    label: "Cancelado",
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
}

export function PedidoEstadoBadge({ estado }: { estado: PedidoEstado }) {
  const s = STYLE[estado]
  return (
    <Badge variant="outline" className={s.className}>
      {s.label}
    </Badge>
  )
}
