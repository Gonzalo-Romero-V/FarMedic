import { Store, UserCog } from "lucide-react"

import { Badge } from "@/components/ui/badge"

const DATE_FMT = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "America/Guayaquil",
})

type Props = {
  nombre: string
  email: string
  miembroDesde: string | null
}

export function EmpleadoAccountCard({ nombre, email, miembroDesde }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-md border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Cuenta
          </h2>
          <p className="text-base font-semibold">{nombre}</p>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
        <Badge
          variant="outline"
          className="border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300"
        >
          <UserCog className="mr-1 h-3 w-3" /> Empleado
        </Badge>
      </div>
      <div className="grid grid-cols-1 gap-2 text-sm">
        <Row
          label="Alcance"
          value={
            <span className="inline-flex items-center gap-1">
              <Store className="h-3 w-3" /> Tu sucursal
            </span>
          }
        />
        <Row
          label="Miembro desde"
          value={miembroDesde ? DATE_FMT.format(new Date(miembroDesde)) : "—"}
        />
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  )
}
