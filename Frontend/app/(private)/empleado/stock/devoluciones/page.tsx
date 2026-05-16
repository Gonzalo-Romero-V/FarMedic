import { DevolucionesData } from "@/components/custom/empleado/stock/devoluciones/devoluciones-data"

export default function EmpleadoDevolucionesPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="h2">Devoluciones</h1>
        <p className="text-sm text-muted-foreground">
          Devoluciones de cliente (+) y a proveedor (−) registradas en tu sucursal.
        </p>
      </div>
      <DevolucionesData />
    </div>
  )
}
