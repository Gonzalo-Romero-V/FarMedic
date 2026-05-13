import { PagePlaceholder } from "@/components/custom/page-placeholder"

export default function AdminKardexPage() {
  return (
    <PagePlaceholder
      title="Kardex global"
      subtitle="Historial inmutable de movimientos de stock — todas las sucursales."
      todos={[
        "Filtro por sucursal, fecha, tipo, lote",
        "Detalle de cada movimiento (referencia polimórfica)",
        "Exportar a CSV",
      ]}
    />
  )
}
