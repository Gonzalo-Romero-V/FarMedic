import { LotesData } from "@/components/custom/admin/inventario/lotes/lotes-data"

export default function AdminLotesPage() {
  return (
    <section className="container mx-auto flex flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="h1 text-foreground">Lotes y caducidad</h1>
        <p className="body text-muted-foreground">
          Gestión global de lotes con vencimientos. El stock no se edita acá — se cambia mediante
          movimientos en el Kardex.
        </p>
      </header>
      <LotesData />
    </section>
  )
}
