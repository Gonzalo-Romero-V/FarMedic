import { StockOverviewData } from "@/components/custom/empleado/stock/overview/stock-overview-data"
import { StockSubnav } from "@/components/custom/empleado/stock/overview/stock-subnav"

export default function EmpleadoStockPage() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="h2">Stock</h1>
        <p className="text-sm text-muted-foreground">
          Inventario, lotes y movimientos de tu sucursal.
        </p>
      </div>
      <StockSubnav />
      <StockOverviewData />
    </div>
  )
}
