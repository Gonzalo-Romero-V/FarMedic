"use client"

import { AlertTriangle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { AuditoriaRecienteCard } from "./auditoria-reciente-card"
import { KpiRow } from "./kpi-row"
import { LotesPorVencerCard } from "./lotes-por-vencer-card"
import { PedidosPendientesCard } from "./pedidos-pendientes-card"
import { StockCriticoCard } from "./stock-critico-card"
import { useAdminDashboard } from "./use-admin-dashboard"

/**
 * Isla cliente del dashboard admin. Encapsula el fetch a `/api/admin/dashboard`
 * y delega el render a los componentes presentacionales (que ya manejan loading
 * vía `items === undefined` y vacío vía `items.length === 0`).
 */
export function AdminDashboardData() {
  const state = useAdminDashboard()

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
      <KpiRow
        ventasDelDia={data?.kpis.ventasDelDia}
        stockCriticoCount={data?.kpis.stockCriticoCount}
        lotesPorVencerCount={data?.kpis.lotesPorVencerCount}
        pedidosPendientesCount={data?.kpis.pedidosPendientesCount}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StockCriticoCard items={data?.stockCritico} />
        <LotesPorVencerCard items={data?.lotesPorVencer} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PedidosPendientesCard items={data?.pedidosPendientes} />
        <AuditoriaRecienteCard items={data?.auditoriaReciente} />
      </div>
    </>
  )
}
