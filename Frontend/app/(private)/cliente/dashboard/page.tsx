import { ClienteDashboardData } from "@/components/custom/cliente/dashboard/cliente-dashboard-data"

export default function ClienteDashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="h2">Mi cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Resumen de tus pedidos y acceso rápido al catálogo.
        </p>
      </div>
      <ClienteDashboardData />
    </div>
  )
}
