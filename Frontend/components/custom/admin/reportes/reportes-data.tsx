"use client"

import { Download, FileText } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

import {
  descargarReportePdf,
  useReporteMensual,
  type ReporteMensual,
} from "./use-admin-reportes"

const USD = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" })

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

function asNum(v: string | number): number {
  return typeof v === "number" ? v : Number(v)
}

export function ReportesData() {
  const now = new Date()
  const [year, setYear] = useState<number>(now.getFullYear())
  const [month, setMonth] = useState<number>(now.getMonth() + 1)
  const [descargando, setDescargando] = useState(false)
  const state = useReporteMensual(year, month)

  // 5 años hacia atrás + año actual para el selector.
  const years = Array.from({ length: 6 }).map((_, i) => now.getFullYear() - i)

  const handleDescargar = async () => {
    setDescargando(true)
    try {
      await descargarReportePdf(year, month)
      toast.success("PDF generado")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al descargar"
      toast.error(msg)
    } finally {
      setDescargando(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Reporte mensual
          </CardTitle>
          <CardDescription>
            Elegí el mes y descargá el PDF totalizado + por sucursal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label className="xs uppercase tracking-wide text-muted-foreground">Año</Label>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-1.5">
              <Label className="xs uppercase tracking-wide text-muted-foreground">Mes</Label>
              <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((m, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleDescargar}
              disabled={descargando || state.status !== "ready"}
              className="sm:self-end"
            >
              <Download className="mr-2 h-4 w-4" />
              {descargando ? "Generando..." : "Descargar PDF"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {state.status === "loading" && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {state.status === "error" && (
        <Alert variant="destructive">
          <AlertTitle>No se pudo generar el preview</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.status === "ready" && <ReportePreview data={state.data} />}
    </div>
  )
}

function ReportePreview({ data }: { data: ReporteMensual }) {
  const totalizado = data.ventas.totalizado
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Ventas — {data.periodo.mes_label}</CardTitle>
          <CardDescription>
            {data.periodo.desde} a {data.periodo.hasta}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!totalizado || totalizado.cantidad === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Sin ventas registradas en el período.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Metric label="Operaciones" value={String(totalizado.cantidad)} />
                <Metric label="Subtotal" value={USD.format(asNum(totalizado.subtotal))} />
                <Metric label="IVA" value={USD.format(asNum(totalizado.impuesto_total))} />
                <Metric label="Total" value={USD.format(asNum(totalizado.total))} highlight />
              </div>

              {data.ventas.por_sucursal.length > 0 && (
                <div className="mt-4 overflow-hidden rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left">Sucursal</th>
                        <th className="px-3 py-2 text-right">Operaciones</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.ventas.por_sucursal.map((s) => (
                        <tr key={s.sucursal_id} className="border-t">
                          <td className="px-3 py-2">
                            {s.nombre}
                            <span className="ml-1 text-xs text-muted-foreground">· {s.ciudad}</span>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">{s.cantidad}</td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {USD.format(asNum(s.total))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock crítico al cierre</CardTitle>
          <CardDescription>
            Snapshot al último día del período.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.stock_critico.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Sin medicamentos bajo el mínimo.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {data.stock_critico.map((bloque) => (
                <div key={bloque.sucursal}>
                  <h4 className="mb-1.5 text-sm font-semibold">{bloque.sucursal}</h4>
                  <ul className="rounded-md border bg-card px-3 text-sm">
                    {bloque.items.map((it) => (
                      <li
                        key={it.medicamento_id}
                        className="flex items-center justify-between border-t py-1.5 first:border-t-0"
                      >
                        <span>{it.medicamento_nombre}</span>
                        <span className="text-xs tabular-nums text-destructive">
                          {it.stock_actual} / {it.stock_minimo}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Movimientos Kardex</CardTitle>
          <CardDescription>Conteo por tipo en el período.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.kardex.totalizado.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Sin movimientos en el período.
            </p>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Tipo</th>
                    <th className="px-3 py-2 text-right">Movimientos</th>
                    <th className="px-3 py-2 text-right">Unidades</th>
                  </tr>
                </thead>
                <tbody>
                  {data.kardex.totalizado.map((r) => (
                    <tr key={r.tipo} className="border-t">
                      <td className="px-3 py-2 capitalize">{r.tipo.replace(/_/g, " ")}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.cantidad}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{asNum(r.unidades)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={highlight ? "h3 text-primary tabular-nums" : "text-base tabular-nums"}>
        {value}
      </span>
    </div>
  )
}
