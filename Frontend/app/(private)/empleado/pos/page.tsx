import { PosData } from "@/components/custom/empleado/pos/pos-data"

export default function EmpleadoPosPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="h2">Punto de venta</h1>
        <p className="text-sm text-muted-foreground">
          Cada venta descuenta stock automáticamente del lote con vencimiento más próximo (FEFO).
        </p>
      </div>
      <PosData />
    </div>
  )
}
