import {
  AlertTriangle,
  CalendarClock,
  CalendarX2,
  DollarSign,
  Layers,
  Pill,
} from "lucide-react"

import { StatCard } from "@/components/custom/admin/dashboard/stat-card"

const USD = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" })

type Props = {
  totalMedicamentos?: number
  totalLotesActivos?: number
  stockCriticoCount?: number
  lotesPorVencerCount?: number
  lotesVencidosCount?: number
  valorInventarioUsd?: number | null
}

/**
 * 5 KPIs obligatorios + valor opcional (oculto si el backend lo devuelve null).
 * Reutiliza StatCard del módulo dashboard porque el patrón visual es idéntico.
 */
export function InventarioKpiRow({
  totalMedicamentos,
  totalLotesActivos,
  stockCriticoCount,
  lotesPorVencerCount,
  lotesVencidosCount,
  valorInventarioUsd,
}: Props) {
  const mostrarValor = valorInventarioUsd !== null && valorInventarioUsd !== undefined
  return (
    <section
      aria-label="Indicadores de inventario"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
    >
      <StatCard
        label="Medicamentos"
        icon={Pill}
        tone="neutral"
        value={totalMedicamentos === undefined ? undefined : String(totalMedicamentos)}
        hint="Activos en catálogo"
      />
      <StatCard
        label="Lotes activos"
        icon={Layers}
        tone="brand"
        value={totalLotesActivos === undefined ? undefined : String(totalLotesActivos)}
        hint="Vigentes con stock"
      />
      <StatCard
        label="Stock crítico"
        icon={AlertTriangle}
        tone="danger"
        value={stockCriticoCount === undefined ? undefined : String(stockCriticoCount)}
        hint="Bajo el mínimo"
      />
      <StatCard
        label="Por vencer"
        icon={CalendarClock}
        tone="warning"
        value={lotesPorVencerCount === undefined ? undefined : String(lotesPorVencerCount)}
        hint="Próximos 30 días"
      />
      <StatCard
        label="Vencidos con stock"
        icon={CalendarX2}
        tone="danger"
        value={lotesVencidosCount === undefined ? undefined : String(lotesVencidosCount)}
        hint="Pendientes de dar de baja"
      />
      {mostrarValor && (
        <StatCard
          label="Valor inventario"
          icon={DollarSign}
          tone="brand"
          value={USD.format(valorInventarioUsd!)}
          hint="SUM(cantidad × costo) lotes vigentes"
        />
      )}
    </section>
  )
}
