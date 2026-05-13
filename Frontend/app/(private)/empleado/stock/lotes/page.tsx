import { PagePlaceholder } from "@/components/custom/page-placeholder"

export default function EmpleadoLotesPage() {
  return (
    <PagePlaceholder
      title="Lotes y caducidad"
      subtitle="Lotes presentes en tu sucursal."
      todos={[
        "Listado con vencimiento y cantidad",
        "Alertas de caducidad (próximos a vencer)",
        "FEFO visible: lote más viejo primero",
      ]}
    />
  )
}
