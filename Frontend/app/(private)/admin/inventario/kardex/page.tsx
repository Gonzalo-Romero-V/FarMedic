import { KardexData } from "@/components/custom/admin/inventario/kardex/kardex-data"

export default function AdminKardexPage() {
  return (
    <section className="container mx-auto flex flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="h1 text-foreground">Kardex global</h1>
        <p className="body text-muted-foreground">
          Historial inmutable de movimientos de stock — todas las sucursales. Solo entradas
          automáticas (ingresos por lotes, ventas) y manuales (ajustes, pérdidas, vencimientos).
        </p>
      </header>
      <KardexData />
    </section>
  )
}
