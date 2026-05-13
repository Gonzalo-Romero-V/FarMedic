import { PagePlaceholder } from "@/components/custom/page-placeholder"

/**
 * Catálogo en contexto de cliente autenticado. Difiere del público
 * (`app/(public)/catalogo`) en que acá sí hay acciones: agregar al carrito,
 * crear pedido, ver disponibilidad por sucursal, historial de compras.
 *
 * Cuando se implemente el catálogo real, ambas páginas deberían reutilizar
 * un componente compartido `<CatalogList>` y diferir solo en las acciones.
 */
export default function ClienteCatalogoPage() {
  return (
    <PagePlaceholder
      title="Catálogo"
      subtitle="Explorá medicamentos y armá tu pedido."
      todos={[
        "Listado paginado con búsqueda",
        "Filtros por categoría y disponibilidad por sucursal",
        "Botón 'Agregar al pedido' (carrito persistente)",
        "Indicador de medicamentos comprados antes",
        "Subida de receta cuando el ítem la requiere",
      ]}
    />
  )
}
