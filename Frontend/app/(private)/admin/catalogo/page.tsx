import { PagePlaceholder } from "@/components/custom/page-placeholder"

export default function AdminCatalogoPage() {
  return (
    <PagePlaceholder
      title="Catálogo"
      subtitle="Gestión central de medicamentos, categorías y proveedores."
      todos={[
        "Listado de medicamentos",
        "Alta / edición de medicamento",
        "Cambio de precio (solo admin — RNF-03)",
        "Eliminar (soft delete) y restaurar",
        "Categorías y proveedores",
      ]}
    />
  )
}
