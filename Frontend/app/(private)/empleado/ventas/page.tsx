import { VentasData } from "@/components/custom/empleado/ventas/ventas-data"

export default function EmpleadoVentasPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="h2">Historial de ventas</h1>
        <p className="text-sm text-muted-foreground">
          Ventas registradas en tu sucursal. Filtrá por fecha, estado o método de pago.
        </p>
      </div>
      <VentasData />
    </div>
  )
}
