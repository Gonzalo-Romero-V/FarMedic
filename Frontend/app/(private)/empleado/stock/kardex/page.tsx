import { KardexData } from "@/components/custom/empleado/stock/kardex/kardex-data"

export default function EmpleadoKardexPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="h2">Kardex</h1>
        <p className="text-sm text-muted-foreground">
          Movimientos de stock de tu sucursal. Los ajustes manuales sin signo claro los hace el administrador.
        </p>
      </div>
      <KardexData />
    </div>
  )
}
