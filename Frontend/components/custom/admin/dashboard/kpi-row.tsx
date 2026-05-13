import { AlertTriangle, CalendarClock, DollarSign, ShoppingCart } from "lucide-react"

import { StatCard } from "./stat-card"

const USD = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" })

type KpiRowProps = {
  /** `undefined` en cualquier campo muestra el skeleton del card correspondiente. */
  ventasDelDia?: number
  stockCriticoCount?: number
  lotesPorVencerCount?: number
  pedidosPendientesCount?: number
}

export function KpiRow({
  ventasDelDia,
  stockCriticoCount,
  lotesPorVencerCount,
  pedidosPendientesCount,
}: KpiRowProps) {
  return (
    <section
      aria-label="Indicadores clave"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <StatCard
        label="Ventas del día"
        icon={DollarSign}
        tone="brand"
        value={ventasDelDia === undefined ? undefined : USD.format(ventasDelDia)}
        hint="Total agregado de todas las sucursales"
      />
      <StatCard
        label="Stock crítico"
        icon={AlertTriangle}
        tone="danger"
        value={stockCriticoCount === undefined ? undefined : String(stockCriticoCount)}
        hint="Medicamentos bajo el mínimo"
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
        hint="Sin atender en pedidos online"
      />
    </section>
  )
}
