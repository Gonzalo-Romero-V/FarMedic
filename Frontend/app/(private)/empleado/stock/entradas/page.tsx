import { PagePlaceholder } from "@/components/custom/page-placeholder"

export default function EmpleadoEntradasPage() {
  return (
    <PagePlaceholder
      title="Entradas"
      subtitle="Recepción de lotes nuevos (tipo `ingreso` en movimiento-stock)."
      todos={[
        "Seleccionar proveedor",
        "Crear lote (lote_id, fecha_vencimiento)",
        "Cantidad recibida",
        "Confirmar → genera movimiento tipo `ingreso`",
      ]}
    />
  )
}
