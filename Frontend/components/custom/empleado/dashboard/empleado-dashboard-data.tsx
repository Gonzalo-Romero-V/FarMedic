"use client"

import { AlertTriangle } from "lucide-react"

import { LotesPorVencerCard } from "@/components/custom/admin/dashboard/lotes-por-vencer-card"
import { PedidosPendientesCard } from "@/components/custom/admin/dashboard/pedidos-pendientes-card"
import { StockCriticoCard } from "@/components/custom/admin/dashboard/stock-critico-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { EmpleadoKpiRow } from "./empleado-kpi-row"
import { VentasRecientesCard } from "./ventas-recientes-card"
import { useEmpleadoDashboard } from "./use-empleado-dashboard"

/**
 * Dashboard del empleado: scope sucursal del usuario logueado. Reusa cards admin
 * cuyas señales/shape son idénticas (StockCritico, LotesPorVencer, PedidosPendientes);
 * agrega VentasRecientesCard propia para la operación del POS.
 */
export function EmpleadoDashboardData() {
  const state = useEmpleadoDashboard()

  if (state.status === "error") {
    return (
      <Alert variant="destructive">
        <AlertTriangle />
        <AlertTitle>No se pudo cargar el dashboard</AlertTitle>
        <AlertDescription>{state.error}</AlertDescription>
      </Alert>
    )
  }

  const data = state.status === "ready" ? state.data : null

  return (
    <>
      <EmpleadoKpiRow
        ventasDelDia={data?.kpis.ventasDelDia}
        ventasCountDia={data?.kpis.ventasCountDia}
        stockCriticoCount={data?.kpis.stockCriticoCount}
        lotesPorVencerCount={data?.kpis.lotesPorVencerCount}
        pedidosPendientesCount={data?.kpis.pedidosPendientesCount}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <VentasRecientesCard items={data?.ventasRecientes} />
        <PedidosPendientesCard items={data?.pedidosPendientes} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StockCriticoCard items={data?.stockCritico} />
        <LotesPorVencerCard items={data?.lotesPorVencer} />
      </div>
    </>
  )
}
