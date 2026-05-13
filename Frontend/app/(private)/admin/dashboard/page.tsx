import { PagePlaceholder } from "@/components/custom/page-placeholder"

export default function AdminDashboardPage() {
  return (
    <PagePlaceholder
      title="Dashboard global"
      subtitle="Métricas agregadas de todas las sucursales."
      todos={[
        "Ventas del día (total agregado)",
        "Stock crítico por sucursal",
        "Lotes próximos a vencer",
        "Pedidos pendientes",
        "Auditoría reciente",
      ]}
    />
  )
}
