import { History } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export type AuditoriaEvento = {
  id: string
  actor: string
  /** Verbo en pasado, ej. "ajustó stock" */
  accion: string
  entidad: string
  /** ISO datetime */
  fecha: string
}

type Props = {
  items?: readonly AuditoriaEvento[]
}

const ROW_SKELETON_COUNT = 5
const DATETIME_FMT = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
})

export function AuditoriaRecienteCard({ items }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" aria-hidden />
          Auditoría reciente
        </CardTitle>
        <CardDescription>Últimos eventos del sistema</CardDescription>
      </CardHeader>
      <CardContent>
        {items === undefined ? (
          <ul className="space-y-3">
            {Array.from({ length: ROW_SKELETON_COUNT }).map((_, i) => (
              <li key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-24" />
              </li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground">
            Aún no hay eventos registrados.
          </p>
        ) : (
          <ol className="relative space-y-4 border-l border-border pl-4">
            {items.map((it) => (
              <li key={it.id} className="relative">
                <span className="absolute -left-[1.3rem] top-1.5 h-2 w-2 rounded-full bg-primary" aria-hidden />
                <p className="small">
                  <span className="font-medium">{it.actor}</span>{" "}
                  <span className="text-muted-foreground">{it.accion}</span>{" "}
                  <span className="font-medium">{it.entidad}</span>
                </p>
                <p className="xs text-muted-foreground">
                  {DATETIME_FMT.format(new Date(it.fecha))}
                </p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
