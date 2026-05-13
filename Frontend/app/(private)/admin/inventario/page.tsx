import { PagePlaceholder } from "@/components/custom/page-placeholder"

export default function AdminInventarioPage() {
  return (
    <PagePlaceholder
      title="Inventario global"
      subtitle="Vista consolidada de stock, kardex y lotes a través de todas las sucursales."
      todos={[
        "Stock por sucursal y por medicamento",
        "Filtros: sucursal, categoría, estado de lote",
        "Acceso a Kardex global y Lotes",
        "Ajustes manuales (con justificación obligatoria)",
      ]}
    />
  )
}
