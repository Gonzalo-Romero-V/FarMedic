import { AlertTriangle, CalendarClock, DollarSign, Receipt, ShoppingCart } from "lucide-react"

import { StatCard } from "@/components/custom/admin/dashboard/stat-card"

const USD = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" })

type Props = {
  ventasDelDia?: number
  ventasCountDia?: number
  stockCriticoCount?: number
  lotesPorVencerCount?: number
  pedidosPendientesCount?: number
}

export function EmpleadoKpiRow({
  ventasDelDia,
  ventasCountDia,
  stockCriticoCount,
  lotesPorVencerCount,
  pedidosPendientesCount,
}: Props) {
  return (
    <section
      aria-label="Indicadores de mi sucursal"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      <StatCard
        label="Ventas del día"
        icon={DollarSign}
        tone="brand"
        value={ventasDelDia === undefined ? undefined : USD.format(ventasDelDia)}
        hint="Total en tu sucursal"
      />
      <StatCard
        label="Operaciones"
        icon={Receipt}
        value={ventasCountDia === undefined ? undefined : String(ventasCountDia)}
        hint="Ventas completadas hoy"
      />
      <StatCard
        label="Stock crítico"
        icon={AlertTriangle}
        tone="danger"
        value={stockCriticoCount === undefined ? undefined : String(stockCriticoCount)}
        hint="Bajo el mínimo"
      />
      <StatCard
        label="Lotes por vencer"
        icon={CalendarClock}
        tone="warning"
        value={lotesPorVencerCount === undefined ? undefined : String(lotesPorVencerCount)}
        hint="Próximos 30 días"
      />
      <StatCard
        label="Pedidos pendientes"
        icon={ShoppingCart}
        value={pedidosPendientesCount === undefined ? undefined : String(pedidosPendientesCount)}
        hint="A despachar"
      />
    </section>
  )
}
