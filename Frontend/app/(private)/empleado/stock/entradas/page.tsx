import { EntradasData } from "@/components/custom/empleado/stock/entradas/entradas-data"

export default function EmpleadoEntradasPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="h2">Entradas</h1>
        <p className="text-sm text-muted-foreground">
          Recepciones de proveedor: ingresos automáticos generados al registrar un lote nuevo.
        </p>
      </div>
      <EntradasData />
    </div>
  )
}
