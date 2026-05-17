import { CheckCircle, Clock, DollarSign, Truck } from "lucide-react"

import { StatCard } from "@/components/custom/admin/dashboard/stat-card"

const USD = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" })

type Props = {
  pedidosPendientes?: number
  pedidosEnCamino?: number
  pedidosEntregados?: number
  totalGastado?: number
}

export function ClienteKpiRow({
  pedidosPendientes,
  pedidosEnCamino,
  pedidosEntregados,
  totalGastado,
}: Props) {
  return (
    <section
      aria-label="Indicadores de mi cuenta"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <StatCard
        label="Pendientes"
        icon={Clock}
        tone="warning"
        value={pedidosPendientes === undefined ? undefined : String(pedidosPendientes)}
        hint="Esperando preparación"
      />
      <StatCard
        label="En camino"
        icon={Truck}
        value={pedidosEnCamino === undefined ? undefined : String(pedidosEnCamino)}
        hint="Despachados, en tránsito"
      />
      <StatCard
        label="Entregados"
        icon={CheckCircle}
        tone="brand"
        value={pedidosEntregados === undefined ? undefined : String(pedidosEntregados)}
        hint="Historial completado"
      />
      <StatCard
        label="Total gastado"
        icon={DollarSign}
        tone="brand"
        value={totalGastado === undefined ? undefined : USD.format(totalGastado)}
        hint="Sobre entregados"
      />
    </section>
  )
}
