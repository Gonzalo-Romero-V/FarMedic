"use client"

import { AlertTriangle, ShoppingBag } from "lucide-react"
import Link from "next/link"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { ClienteKpiRow } from "./cliente-kpi-row"
import { PedidosRecientesCard } from "./pedidos-recientes-card"
import { useClienteDashboard } from "./use-cliente-dashboard"

export function ClienteDashboardData() {
  const state = useClienteDashboard()

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
      <ClienteKpiRow
        pedidosPendientes={data?.kpis.pedidosPendientes}
        pedidosEnCamino={data?.kpis.pedidosEnCamino}
        pedidosEntregados={data?.kpis.pedidosEntregados}
        totalGastado={data?.kpis.totalGastado}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PedidosRecientesCard items={data?.pedidosRecientes} />
        </div>

        <Card>
          <CardContent className="flex flex-col items-start gap-3">
            <ShoppingBag className="h-8 w-8 text-primary" />
            <div>
              <h3 className="h4">¿Necesitás algo más?</h3>
              <p className="xs text-muted-foreground">
                Revisá el catálogo y armá un nuevo pedido en minutos.
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href="/cliente/catalogo">Ver catálogo</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
