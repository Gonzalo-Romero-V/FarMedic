import { PagePlaceholder } from "@/components/custom/page-placeholder"

type Props = { params: Promise<{ id: string }> }

export default async function ClientePedidoDetailPage({ params }: Props) {
  const { id } = await params
  return (
    <PagePlaceholder
      title={`Pedido #${id}`}
      subtitle="Detalle, ítems, estado y receta asociada (si aplica)."
      todos={["Items y subtotales", "Estado actual y timeline", "Receta cargada", "Acciones permitidas según estado"]}
    />
  )
}
