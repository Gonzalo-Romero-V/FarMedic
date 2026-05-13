import { PagePlaceholder } from "@/components/custom/page-placeholder"

export default function EmpleadoDevolucionesPage() {
  return (
    <PagePlaceholder
      title="Devoluciones"
      subtitle="Devoluciones de venta (cliente regresa producto)."
      todos={[
        "Buscar venta por comprobante o cliente",
        "Seleccionar ítems a devolver",
        "Confirmar → genera movimiento tipo `devolucion_cliente` (positivo)",
        "Devolución a proveedor: solo Administrador",
      ]}
    />
  )
}
