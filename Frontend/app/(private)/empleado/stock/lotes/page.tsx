import { LotesData } from "@/components/custom/empleado/stock/lotes/lotes-data"

export default function EmpleadoLotesPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="h2">Lotes</h1>
        <p className="text-sm text-muted-foreground">
          Lotes de tu sucursal. Registrar un lote nuevo dispara automáticamente el movimiento de ingreso.
        </p>
      </div>
      <LotesData />
    </div>
  )
}
