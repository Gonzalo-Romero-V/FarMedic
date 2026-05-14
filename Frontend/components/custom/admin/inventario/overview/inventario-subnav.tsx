import Link from "next/link"
import { CalendarClock, Layers, Pill } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type SubnavLink = {
  href: string
  label: string
  description: string
  icon: LucideIcon
}

const LINKS: readonly SubnavLink[] = [
  {
    href: "/admin/inventario/medicamentos",
    label: "Medicamentos",
    description: "Stock agregado por producto y sucursal",
    icon: Pill,
  },
  {
    href: "/admin/inventario/lotes",
    label: "Lotes",
    description: "Alta y gestión por lote",
    icon: Layers,
  },
  {
    href: "/admin/inventario/kardex",
    label: "Kardex",
    description: "Historial de movimientos + alta manual",
    icon: CalendarClock,
  },
]

/**
 * Sub-navegación dentro del módulo Inventario. Render como tarjetas-link
 * para que sirva de overview accionable cuando el admin entra al módulo.
 */
export function InventarioSubnav() {
  return (
    <nav aria-label="Sub-secciones de inventario" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {LINKS.map((link) => (
        <Link key={link.href} href={link.href} className="group">
          <Card
            size="sm"
            className={cn(
              "flex flex-row items-center gap-3 px-4 transition-colors",
              "group-hover:ring-primary/60 group-hover:bg-accent/40",
            )}
          >
            <link.icon className="h-5 w-5 text-primary" aria-hidden />
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{link.label}</span>
              <span className="xs text-muted-foreground">{link.description}</span>
            </div>
          </Card>
        </Link>
      ))}
    </nav>
  )
}
