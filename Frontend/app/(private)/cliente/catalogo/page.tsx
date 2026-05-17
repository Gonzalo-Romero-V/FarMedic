import { CatalogoData } from "@/components/custom/cliente/catalogo/catalogo-data"

export default function ClienteCatalogoPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="h2">Catálogo</h1>
        <p className="text-sm text-muted-foreground">
          Explorá medicamentos disponibles. Agregá al carrito y confirmá tu pedido.
        </p>
      </div>
      <CatalogoData />
    </div>
  )
}
