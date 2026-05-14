import { Badge } from "@/components/ui/badge"

/**
 * Badge canónico para representar el estado computado de un lote.
 * Estados según [[lote]] en el vault:
 *   - `vigente`        — fecha_vencimiento > hoy + 30d
 *   - `proximo_a_vencer` — hoy ≤ fecha_vencimiento ≤ hoy + 30d (alerta amarilla, RF-03)
 *   - `vencido`        — fecha_vencimiento < hoy (alerta roja, RF-03)
 *
 * Umbral 30d definido en `domain/lote.md`. Mantener sincronizado con
 * `VENCIMIENTO_THRESHOLD_DAYS` del backend.
 */

export type LoteEstado = "vigente" | "proximo_a_vencer" | "vencido"

const THRESHOLD_DAYS = 30

const STYLES: Record<LoteEstado, { label: string; className: string }> = {
  vigente: {
    label: "Vigente",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  proximo_a_vencer: {
    label: "Próximo a vencer",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  vencido: {
    label: "Vencido",
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
}

/** Calcula el estado a partir de una fecha ISO (YYYY-MM-DD). */
export function loteEstadoFromFecha(fechaVencimiento: string): LoteEstado {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const venc = new Date(fechaVencimiento)
  venc.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((venc.getTime() - hoy.getTime()) / 86_400_000)
  if (diffDays < 0) return "vencido"
  if (diffDays <= THRESHOLD_DAYS) return "proximo_a_vencer"
  return "vigente"
}

type Props =
  | { estado: LoteEstado; fechaVencimiento?: never }
  | { estado?: never; fechaVencimiento: string }

export function LoteEstadoBadge(props: Props) {
  const estado: LoteEstado =
    props.estado ?? loteEstadoFromFecha(props.fechaVencimiento)
  const { label, className } = STYLES[estado]
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}
