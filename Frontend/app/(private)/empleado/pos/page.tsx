import { PagePlaceholder } from "@/components/custom/page-placeholder"

export default function EmpleadoPosPage() {
  return (
    <PagePlaceholder
      title="Punto de venta"
      subtitle="Operación rápida de venta. Las operaciones complejas de inventario viven en `Stock`."
      todos={[
        "Búsqueda (nombre / principio activo / código de barras)",
        "Carrito",
        "Solicitud de receta cuando el medicamento la requiere",
        "Selección de método de pago",
        "Confirmar venta (descuenta lotes FEFO + genera movimiento)",
        "Consulta rápida de stock (modal, sin salir del POS)",
        "Devoluciones de venta (modal)",
      ]}
    />
  )
}
