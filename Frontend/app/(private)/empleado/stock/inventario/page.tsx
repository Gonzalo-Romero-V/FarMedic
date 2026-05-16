import { InventarioData } from "@/components/custom/empleado/stock/inventario/inventario-data"

export default function EmpleadoStockInventarioPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="h2">Inventario</h1>
        <p className="text-sm text-muted-foreground">
          Stock por medicamento en tu sucursal. Los precios y el catálogo los gestiona el administrador.
        </p>
      </div>
      <InventarioData />
    </div>
  )
}
