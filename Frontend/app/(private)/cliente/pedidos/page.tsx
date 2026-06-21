import { PedidosData } from "@/components/custom/cliente/pedidos/pedidos-data"

export default function ClientePedidosPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="h2">Mis pedidos</h1>
        <p className="text-sm text-muted-foreground">
          Pedidos online creados por ti. Fíltralos por estado y consulta el detalle.
        </p>
      </div>
      <PedidosData />
    </div>
  )
}
