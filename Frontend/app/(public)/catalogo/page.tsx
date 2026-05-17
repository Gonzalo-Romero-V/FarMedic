import { CatalogoPublicoData } from "@/components/custom/public/catalogo/catalogo-publico-data"

export default function CatalogoPublicoPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="h2">Catálogo</h1>
        <p className="text-sm text-muted-foreground">
          Explorá los medicamentos disponibles. Para hacer pedidos, iniciá sesión.
        </p>
      </div>
      <CatalogoPublicoData />
    </div>
  )
}
