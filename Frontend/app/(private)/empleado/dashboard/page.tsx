import { PagePlaceholder } from "@/components/custom/page-placeholder"

export default function EmpleadoDashboardPage() {
  return (
    <PagePlaceholder
      title="Dashboard de sucursal"
      subtitle="Tu actividad en la sucursal asignada."
      todos={[
        "Ventas del día",
        "Alertas de stock bajo",
        "Productos próximos a caducar",
        "Movimientos recientes (Kardex local)",
      ]}
    />
  )
}
