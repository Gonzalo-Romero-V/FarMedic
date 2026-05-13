import { PagePlaceholder } from "@/components/custom/page-placeholder"

export default function ClientePedidosPage() {
  return (
    <PagePlaceholder
      title="Mis pedidos"
      subtitle="Pedidos online creados por vos."
      todos={[
        "Listado: en curso / entregados / cancelados",
        "Click → detalle del pedido",
        "Seguimiento del estado",
      ]}
    />
  )
}
