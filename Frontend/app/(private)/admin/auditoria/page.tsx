import { PagePlaceholder } from "@/components/custom/page-placeholder"

export default function AdminAuditoriaPage() {
  return (
    <PagePlaceholder
      title="Auditoría"
      subtitle="Log de acciones sensibles del sistema."
      todos={[
        "Cambios de precio",
        "Eliminación / restauración de productos",
        "Anulación de ventas",
        "Cambios de rol de usuario",
      ]}
    />
  )
}
