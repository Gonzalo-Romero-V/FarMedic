import { InventarioOverviewData } from "@/components/custom/admin/inventario/overview/inventario-overview-data"
import { InventarioSubnav } from "@/components/custom/admin/inventario/overview/inventario-subnav"

export default function AdminInventarioPage() {
  return (
    <section className="container mx-auto flex flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="h1 text-foreground">Inventario global</h1>
        <p className="body text-muted-foreground">
          Vista consolidada de stock, lotes y movimientos a través de todas las sucursales.
        </p>
      </header>
      <InventarioSubnav />
      <InventarioOverviewData />
    </section>
  )
}
