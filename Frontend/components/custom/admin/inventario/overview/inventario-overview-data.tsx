"use client"

import { AlertTriangle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LotesPorVencerCard } from "@/components/custom/admin/dashboard/lotes-por-vencer-card"
import { StockCriticoCard } from "@/components/custom/admin/dashboard/stock-critico-card"

import { InventarioKpiRow } from "./inventario-kpi-row"
import { useAdminInventarioOverview } from "./use-admin-inventario-overview"

/**
 * Isla cliente del overview de inventario. Comparte componentes presentacionales
 * con el dashboard admin (StockCriticoCard, LotesPorVencerCard) porque el shape
 * del backend es idéntico — el patrón "un endpoint por página" permite este reuso
 * sin adapter extra.
 */
export function InventarioOverviewData() {
  const state = useAdminInventarioOverview()

  if (state.status === "error") {
    return (
      <Alert variant="destructive">
        <AlertTriangle />
        <AlertTitle>No se pudo cargar el overview de inventario</AlertTitle>
        <AlertDescription>{state.error}</AlertDescription>
      </Alert>
    )
  }

  const data = state.status === "ready" ? state.data : null

  return (
    <div className="flex flex-col gap-6">
      <InventarioKpiRow
        totalMedicamentos={data?.kpis.totalMedicamentos}
        totalLotesActivos={data?.kpis.totalLotesActivos}
        stockCriticoCount={data?.kpis.stockCriticoCount}
        lotesPorVencerCount={data?.kpis.lotesPorVencerCount}
        lotesVencidosCount={data?.kpis.lotesVencidosCount}
        valorInventarioUsd={data?.kpis.valorInventarioUsd}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StockCriticoCard items={data?.stockCritico} />
        <LotesPorVencerCard items={data?.lotesPorVencer} />
      </div>
    </div>
  )
}
