"use client"

import { ArrowLeft, House, Truck } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

import type { PedidoResponse } from "../catalogo/use-catalogo"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { PedidoEstadoBadge } from "./pedido-estado-badge"
import { fetchPedidoDetalle, type PedidoEstado } from "./use-cliente-pedidos"

type Props = { id: number }

const DATE_TIME = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Guayaquil",
})

function asNum(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0
  return typeof v === "number" ? v : Number(v)
}

/** Eventos del tracking en orden cronológico. */
function buildTimeline(pedido: PedidoResponse & { fecha_envio?: string | null; fecha_entrega?: string | null; sucursal?: { nombre: string } }) {
  const events: { label: string; fecha: string | null; estado: PedidoEstado }[] = [
    { label: "Pedido confirmado", fecha: pedido.fecha_solicitud, estado: "pendiente" },
    { label: "En camino / preparado", fecha: pedido.fecha_envio ?? null, estado: "en_camino" },
    { label: "Entregado", fecha: pedido.fecha_entrega ?? null, estado: "entregado" },
  ]
  if (pedido.estado === "cancelado") {
    events.push({ label: "Cancelado", fecha: null, estado: "cancelado" })
  }
  return events
}

export function PedidoDetalleData({ id }: Props) {
  const [pedido, setPedido] = useState<PedidoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetchPedidoDetalle(id)
      .then(setPedido)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Error al cargar pedido"),
      )
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (error || !pedido) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error ?? "Pedido no encontrado"}</AlertDescription>
      </Alert>
    )
  }

  const timeline = buildTimeline(pedido as PedidoResponse & { fecha_envio?: string; fecha_entrega?: string })
  const pedidoExt = pedido as PedidoResponse & { sucursal?: { nombre: string } }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/cliente/pedidos">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Volver
          </Link>
        </Button>
        <PedidoEstadoBadge estado={pedido.estado} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-md border bg-card p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Tracking
          </h2>
          <ol className="space-y-3">
            {timeline.map((e, i) => (
              <li key={i} className="flex items-start gap-3">
                <div
                  className={
                    "mt-1 h-2.5 w-2.5 shrink-0 rounded-full " +
                    (e.fecha
                      ? e.estado === "cancelado"
                        ? "bg-destructive"
                        : "bg-primary"
                      : "bg-muted-foreground/30")
                  }
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{e.label}</div>
                  <div className="xs text-muted-foreground">
                    {e.fecha ? DATE_TIME.format(new Date(e.fecha)) : "—"}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-md border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Datos
          </h2>
          <dl className="space-y-2 text-sm">
            <Field
              label="Comprobante"
              value={<span className="font-mono">{pedido.numero_pedido}</span>}
            />
            <Field label="Sucursal" value={pedidoExt.sucursal?.nombre ?? `#${pedido.sucursal_id}`} />
            <Field
              label="Entrega"
              value={
                <span className="inline-flex items-center gap-1">
                  {pedido.tipo_entrega === "domicilio" ? (
                    <>
                      <Truck className="h-3 w-3" />
                      A domicilio
                    </>
                  ) : (
                    <>
                      <House className="h-3 w-3" />
                      Retiro en sucursal
                    </>
                  )}
                </span>
              }
            />
            {pedido.direccion_envio && (
              <Field label="Dirección" value={pedido.direccion_envio} />
            )}
            <Field label="Teléfono" value={pedido.telefono_contacto} />
          </dl>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Producto</th>
              <th className="px-3 py-2 text-right">Cantidad</th>
              <th className="px-3 py-2 text-right">P. Unit</th>
              <th className="px-3 py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {pedido.items.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="px-3 py-2">
                  <div className="font-medium">
                    {it.medicamento?.nombre_comercial ?? `Medicamento #${it.medicamento_id}`}
                  </div>
                  <div className="xs text-muted-foreground">
                    {it.medicamento?.principio_activo}
                  </div>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{it.cantidad}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  ${asNum(it.precio_unitario).toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  ${asNum(it.subtotal).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-md border bg-muted/40 p-4 text-sm">
        <Row label="Subtotal" value={asNum(pedido.subtotal)} />
        <Row
          label={`IVA (${asNum(pedido.iva_tasa_aplicada).toFixed(2)}%)`}
          value={asNum(pedido.impuesto_total)}
        />
        <div className="mt-2 flex items-center justify-between border-t pt-2 text-base font-semibold">
          <span>Total</span>
          <span className="tabular-nums">${asNum(pedido.total).toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="tabular-nums">${value.toFixed(2)}</span>
    </div>
  )
}
