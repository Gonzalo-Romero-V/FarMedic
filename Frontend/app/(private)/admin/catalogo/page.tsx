import { CatalogoData } from "@/components/custom/admin/catalogo/catalogo-data"

export default function AdminCatalogoPage() {
  return (
    <section className="container mx-auto flex flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="h1 text-foreground">Catálogo</h1>
        <p className="body text-muted-foreground">
          Gestión comercial del medicamento (precio, categoría, ubicación, flags). El stock se
          gestiona desde Inventario mediante lotes y movimientos.
        </p>
      </header>
      <CatalogoData />
    </section>
  )
}
