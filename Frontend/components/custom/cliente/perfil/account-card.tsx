import { ShoppingBag } from "lucide-react"

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

export function ClienteAccountCard({ nombre, email, miembroDesde }: Props) {
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
          className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        >
          <ShoppingBag className="mr-1 h-3 w-3" /> Cliente
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        {miembroDesde
          ? `Eres parte de FarMedic desde ${DATE_FMT.format(new Date(miembroDesde))}.`
          : "Bienvenido a FarMedic."}
      </p>
    </div>
  )
}
