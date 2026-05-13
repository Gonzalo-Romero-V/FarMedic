import { PagePlaceholder } from "@/components/custom/page-placeholder"

export default function ClienteDashboardPage() {
  return (
    <PagePlaceholder
      title="Hola 👋"
      subtitle="Resumen de tu actividad en FarMedic."
      todos={[
        "Pedidos en curso",
        "Últimas compras",
        "Recomendaciones (productos comprados antes)",
        "Acceso rápido al catálogo",
      ]}
    />
  )
}
