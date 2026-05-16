"use client"

import { AlertTriangle } from "lucide-react"

import { LotesPorVencerCard } from "@/components/custom/admin/dashboard/lotes-por-vencer-card"
import { StockCriticoCard } from "@/components/custom/admin/dashboard/stock-critico-card"
import { useEmpleadoDashboard } from "@/components/custom/empleado/dashboard/use-empleado-dashboard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

/**
 * Overview de stock del empleado: reusa el endpoint /empleado/dashboard para no
 * duplicar agregados. El admin tiene un endpoint dedicado /admin/inventario/overview
 * porque su scope es global; el empleado opera siempre sobre su sucursal y el dashboard
 * ya trae los mismos KPIs y listas que aplican.
 */
export function StockOverviewData() {
  const state = useEmpleadoDashboard()

  if (state.status === "error") {
    return (
      <Alert variant="destructive">
        <AlertTriangle />
        <AlertTitle>No se pudo cargar el resumen</AlertTitle>
        <AlertDescription>{state.error}</AlertDescription>
      </Alert>
    )
  }

  const data = state.status === "ready" ? state.data : null

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <StockCriticoCard items={data?.stockCritico} />
      <LotesPorVencerCard items={data?.lotesPorVencer} />
    </div>
  )
}
