import { Badge } from "@/components/ui/badge"

import type { RolNombre } from "./use-admin-usuarios"

const STYLE: Record<RolNombre, { label: string; className: string }> = {
  administrador: {
    label: "Admin",
    className: "border-primary/40 bg-primary/10 text-primary",
  },
  empleado: {
    label: "Empleado",
    className: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  cliente: {
    label: "Cliente",
    className: "border-foreground/20 bg-muted text-muted-foreground",
  },
}

export function RolBadge({ rol }: { rol: RolNombre }) {
  const s = STYLE[rol]
  return (
    <Badge variant="outline" className={s.className}>
      {s.label}
    </Badge>
  )
}
