import { PedidosData } from "@/components/custom/empleado/pedidos/pedidos-data"

export default function EmpleadoPedidosPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="h2">Pedidos online</h1>
        <p className="text-sm text-muted-foreground">
          Despachá los pedidos del canal online. Solo podés gestionar los de tu
          sucursal: pendiente → en camino → entregado.
        </p>
      </div>
      <PedidosData />
    </div>
  )
}
