import { PedidoDetalleData } from "@/components/custom/cliente/pedidos/pedido-detalle-data"

type Props = { params: Promise<{ id: string }> }

export default async function ClientePedidoDetailPage({ params }: Props) {
  const { id } = await params
  return (
    <div className="flex flex-col gap-4 p-4">
      <PedidoDetalleData id={Number(id)} />
    </div>
  )
}
