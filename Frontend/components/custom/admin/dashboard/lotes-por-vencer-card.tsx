import { CalendarClock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export type LotePorVencerItem = {
  id: string
  codigoLote: string
  medicamento: string
  sucursal: string
  /** ISO yyyy-mm-dd */
  vencimiento: string
  diasRestantes: number
}

type Props = {
  items?: readonly LotePorVencerItem[]
}

const ROW_SKELETON_COUNT = 4
const DATE_FMT = new Intl.DateTimeFormat("es-EC", { day: "2-digit", month: "2-digit", year: "numeric" })

function severity(dias: number): "danger" | "warning" | "muted" {
  if (dias <= 7) return "danger"
  if (dias <= 30) return "warning"
  return "muted"
}

const SEVERITY_BADGE: Record<ReturnType<typeof severity>, string> = {
  danger: "border-destructive/40 bg-destructive/10 text-destructive",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  muted: "border-foreground/20 bg-muted text-muted-foreground",
}

export function LotesPorVencerCard({ items }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden />
          Lotes próximos a vencer
        </CardTitle>
        <CardDescription>Ordenados por proximidad de vencimiento</CardDescription>
      </CardHeader>
      <CardContent>
        {items === undefined ? (
          <ul className="space-y-3">
            {Array.from({ length: ROW_SKELETON_COUNT }).map((_, i) => (
              <li key={i} className="flex items-center justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
              </li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground">
            Ningún lote vence en los próximos 30 días.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((it) => {
              const sev = severity(it.diasRestantes)
              return (
                <li key={it.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{it.medicamento}</p>
                    <p className="xs text-muted-foreground">
                      Lote {it.codigoLote} · {it.sucursal} · vence {DATE_FMT.format(new Date(it.vencimiento))}
                    </p>
                  </div>
                  <Badge variant="outline" className={SEVERITY_BADGE[sev]}>
                    {it.diasRestantes <= 0 ? "Vencido" : `${it.diasRestantes} d`}
                  </Badge>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
