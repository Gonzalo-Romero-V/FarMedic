import { PagePlaceholder } from "@/components/custom/page-placeholder"

export default function AdminReportesPage() {
  return (
    <PagePlaceholder
      title="Reportes"
      subtitle="Reportes estratégicos del negocio (RNF-03 — solo administrador)."
      todos={["Ventas por período", "Stock crítico", "Lotes vencidos", "Comparativa entre sucursales"]}
    />
  )
}
