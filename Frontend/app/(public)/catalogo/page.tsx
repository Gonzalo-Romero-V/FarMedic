import { PagePlaceholder } from "@/components/custom/page-placeholder"

/**
 * Catálogo público — accesible sin auth (rol Invitado).
 * Solo lectura: ver lista de medicamentos, categoría, precio.
 * No hay carrito persistente avanzado ni acciones que requieran sesión —
 * el botón de "agregar" / "pedir" redirige a /login.
 */
export default function CatalogoPublicoPage() {
  return (
    <PagePlaceholder
      title="Catálogo"
      subtitle="Explorá los medicamentos disponibles. Para hacer pedidos, iniciá sesión."
      todos={[
        "Listado paginado con búsqueda",
        "Filtros por categoría y disponibilidad",
        "Detalle de cada medicamento (precio, requiere receta, principio activo)",
        "Botón 'Pedir' → redirige a /login si no autenticado",
      ]}
    />
  )
}
