import { MedicamentosData } from "@/components/custom/admin/inventario/medicamentos/medicamentos-data"

export default function AdminInventarioMedicamentosPage() {
  return (
    <section className="container mx-auto flex flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="h1 text-foreground">Medicamentos — stock</h1>
        <p className="body text-muted-foreground">
          Vista agregada de stock por medicamento × sucursal. Para alta y edición del catálogo
          (precio, descripción, categoría) usar la sección Catálogo.
        </p>
      </header>
      <MedicamentosData />
    </section>
  )
}
