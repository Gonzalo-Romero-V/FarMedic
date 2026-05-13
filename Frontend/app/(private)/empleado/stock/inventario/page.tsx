import { PagePlaceholder } from "@/components/custom/page-placeholder"

export default function EmpleadoStockInventarioPage() {
  return (
    <PagePlaceholder
      title="Inventario local"
      subtitle="Stock de tu sucursal — solo lectura desde acá. Modificaciones vía Entradas o Devoluciones."
      todos={[
        "Listado por medicamento con cantidad disponible",
        "Filtros: categoría, estado de lote",
        "Click → detalle de lotes",
      ]}
    />
  )
}
