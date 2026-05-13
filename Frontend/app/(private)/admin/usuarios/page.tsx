import { PagePlaceholder } from "@/components/custom/page-placeholder"

export default function AdminUsuariosPage() {
  return (
    <PagePlaceholder
      title="Usuarios"
      subtitle="Administradores y empleados de cada sucursal. Clientes se gestionan en sus pedidos."
      todos={[
        "Listado con filtro por rol y sucursal",
        "Alta de administrador o empleado",
        "Asignación de sucursal",
        "Cambio de rol (requiere autorización admin)",
        "Activar / desactivar usuario",
      ]}
    />
  )
}
