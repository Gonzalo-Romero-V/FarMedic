import { PagePlaceholder } from "@/components/custom/page-placeholder"

export default function EmpleadoKardexPage() {
  return (
    <PagePlaceholder
      title="Kardex local"
      subtitle="Movimientos de stock de tu sucursal — solo lectura. Filtrado obligatorio por `sucursal_id`."
      todos={[
        "Filtros: fecha, tipo, lote",
        "Detalle de cada movimiento (referencia polimórfica: Venta / Pedido / Proveedor / Ajuste)",
      ]}
    />
  )
}
