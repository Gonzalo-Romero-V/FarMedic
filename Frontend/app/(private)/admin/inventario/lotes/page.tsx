import { PagePlaceholder } from "@/components/custom/page-placeholder"

export default function AdminLotesPage() {
  return (
    <PagePlaceholder
      title="Lotes y caducidad"
      subtitle="Gestión global de lotes con vencimientos."
      todos={[
        "Listado con filtro por estado (activo, vencido, próximo a vencer)",
        "Alta de lote (con referencia a proveedor)",
        "Alertas de caducidad",
        "Movimientos asociados a cada lote",
      ]}
    />
  )
}
