import { Globe2, ShieldCheck } from "lucide-react"

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
  sucursalNombre: string | null
  miembroDesde: string | null
}

export function AdminAccountCard({
  nombre,
  email,
  sucursalNombre,
  miembroDesde,
}: Props) {
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
          className="border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300"
        >
          <ShieldCheck className="mr-1 h-3 w-3" />
          Administrador
        </Badge>
      </div>
      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <Row label="Alcance" value={
          <span className="inline-flex items-center gap-1">
            <Globe2 className="h-3 w-3" /> Toda la cadena
          </span>
        } />
        <Row label="Sucursal base" value={sucursalNombre ?? "—"} />
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
