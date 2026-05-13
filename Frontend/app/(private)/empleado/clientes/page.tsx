import { PagePlaceholder } from "@/components/custom/page-placeholder"

export default function EmpleadoClientesPage() {
  return (
    <PagePlaceholder
      title="Clientes"
      subtitle="Clientes que pasaron por tu sucursal — para asociar venta o gestionar pedidos."
      todos={[
        "Búsqueda por email / nombre / teléfono",
        "Detalle: historial de ventas y pedidos",
        "Datos de contacto (visibles en contexto de gestión de entregas)",
      ]}
    />
  )
}
