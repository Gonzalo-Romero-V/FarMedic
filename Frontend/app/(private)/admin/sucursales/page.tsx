import { PagePlaceholder } from "@/components/custom/page-placeholder"

export default function AdminSucursalesPage() {
  return (
    <PagePlaceholder
      title="Sucursales"
      subtitle="Gestión de sucursales (alta, edición, baja)."
      todos={["Listado con filtros", "Alta de sucursal", "Edición", "Desactivación"]}
    />
  )
}
