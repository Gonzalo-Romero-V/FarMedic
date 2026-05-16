import { EmpleadoDashboardData } from "@/components/custom/empleado/dashboard/empleado-dashboard-data"

export default function EmpleadoDashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="h2">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Indicadores y operación reciente de tu sucursal.
        </p>
      </div>
      <EmpleadoDashboardData />
    </div>
  )
}
