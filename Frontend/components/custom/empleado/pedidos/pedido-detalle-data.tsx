"use client"

import { ArrowLeft, House, Truck } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/hooks/use-auth"
import { ApiError } from "@/lib/api"

import { PedidoEstadoBadge } from "./pedido-estado-badge"
import {
  cambiarEstadoPedido,
  fetchPedidoDetalle,
  transicionesValidas,
  type PedidoDetalle,
  type PedidoEstado,
} from "./use-empleado-pedidos"

const DATE_TIME = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Guayaquil",
})

const USD = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" })

function asNum(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0
  return typeof v === "number" ? v : Number(v)
}

const ESTADO_LABEL: Record<PedidoEstado, string> = {
  pendiente: "Marcar pendiente",
  en_camino: "Pasar a en camino",
  entregado: "Marcar entregado",
  cancelado: "Cancelar pedido",
}

const ESTADO_CONFIRM_TITLE: Record<PedidoEstado, string> = {
  pendiente: "¿Volver a marcar como pendiente?",
  en_camino: "¿Confirmar despacho?",
  entregado: "¿Confirmar entrega?",
  cancelado: "¿Cancelar este pedido?",
}

const ESTADO_CONFIRM_DESCRIPTION: Record<PedidoEstado, string> = {
  pendiente:
    "El pedido volverá al estado pendiente y deberá despacharse nuevamente.",
  en_camino:
    "El pedido pasará a 'en camino'. El stock se reservó al confirmar y aún no se descuenta.",
  entregado:
    "Se descontará el stock de los lotes reservados y se generará el movimiento de venta. La operación no se puede deshacer salvo cancelando el pedido (lo que revertiría el stock como devolución).",
  cancelado:
    "El pedido quedará cancelado. Si ya estaba entregado, se generará una devolución que reintegra el stock a los lotes originales.",
}

const ESTADO_CONFIRM_ACTION: Record<PedidoEstado, string> = {
  pendiente: "Sí, volver a pendiente",
  en_camino: "Sí, despachar",
  entregado: "Sí, marcar entregado",
  cancelado: "Sí, cancelar pedido",
}

type Props = { id: number }

export function PedidoDetalleData({ id }: Props) {
  const { user } = useAuth()
  const [pedido, setPedido] = useState<PedidoDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<PedidoEstado | null>(null)
  const [confirming, setConfirming] = useState<PedidoEstado | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchPedidoDetalle(id)
      .then((data) => {
        if (!cancelled) setPedido(data)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const msg =
          err instanceof ApiError
            ? ((err.payload as { message?: string } | undefined)?.message ??
              `Error ${err.status} al cargar pedido`)
            : err instanceof Error
              ? err.message
              : "Error al cargar pedido"
        setError(msg)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  async function confirmarCambio() {
    if (!pedido || !confirming) return
    const nuevo = confirming
    setPending(nuevo)
    setConfirming(null)
    try {
      const actualizado = await cambiarEstadoPedido(pedido.id, nuevo)
      setPedido({ ...pedido, ...actualizado })
      toast.success(`Pedido actualizado a ${nuevo.replace("_", " ")}`)
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? ((err.payload as { message?: string } | undefined)?.message ??
            `Error ${err.status} al actualizar`)
          : err instanceof Error
            ? err.message
            : "Error al actualizar"
      toast.error(msg)
    } finally {
      setPending(null)
    }
  }

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

  const opciones = transicionesValidas(pedido.estado)
  const ajenoASucursal =
    user?.sucursal_id != null && pedido.sucursal_id !== user.sucursal_id

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/empleado/pedidos">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Volver
          </Link>
        </Button>
        <PedidoEstadoBadge estado={pedido.estado} />
      </div>

      {ajenoASucursal && (
        <Alert>
          <AlertDescription>
            Este pedido pertenece a otra sucursal. Solo podés ver el detalle; los
            cambios de estado los realiza la sucursal asignada.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-md border bg-card p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Cliente y entrega
          </h2>
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <Field
              label="Cliente"
              value={pedido.cliente?.nombre ?? `#${pedido.cliente_id}`}
            />
            <Field label="Email" value={pedido.cliente?.email ?? "—"} />
            <Field label="Teléfono" value={pedido.telefono_contacto} />
            <Field
              label="Entrega"
              value={
                <span className="inline-flex items-center gap-1">
                  {pedido.tipo_entrega === "domicilio" ? (
                    <>
                      <Truck className="h-3 w-3" /> A domicilio
                    </>
                  ) : (
                    <>
                      <House className="h-3 w-3" /> Retiro en sucursal
                    </>
                  )}
                </span>
              }
            />
            {pedido.direccion_envio && (
              <Field label="Dirección" value={pedido.direccion_envio} />
            )}
            <Field
              label="Sucursal"
              value={pedido.sucursal?.nombre ?? `#${pedido.sucursal_id}`}
            />
          </dl>
        </div>

        <div className="rounded-md border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Comprobante
          </h2>
          <dl className="space-y-2 text-sm">
            <Field
              label="N°"
              value={<span className="font-mono">{pedido.numero_pedido}</span>}
            />
            <Field
              label="Solicitado"
              value={DATE_TIME.format(new Date(pedido.fecha_solicitud))}
            />
            <Field
              label="Enviado"
              value={
                pedido.fecha_envio
                  ? DATE_TIME.format(new Date(pedido.fecha_envio))
                  : "—"
              }
            />
            <Field
              label="Entregado"
              value={
                pedido.fecha_entrega
                  ? DATE_TIME.format(new Date(pedido.fecha_entrega))
                  : "—"
              }
            />
            {pedido.gestor && (
              <Field label="Gestor" value={pedido.gestor.nombre} />
            )}
          </dl>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Producto</th>
              <th className="px-3 py-2 text-left">Lote</th>
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
                    {it.medicamento?.nombre_comercial ??
                      `Medicamento #${it.medicamento_id}`}
                  </div>
                  <div className="xs text-muted-foreground">
                    {it.medicamento?.principio_activo}
                  </div>
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {it.lote?.numero_lote ?? "—"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{it.cantidad}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {USD.format(asNum(it.precio_unitario))}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {USD.format(asNum(it.subtotal))}
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
          <span className="tabular-nums">{USD.format(asNum(pedido.total))}</span>
        </div>
      </div>

      {opciones.length > 0 && !ajenoASucursal && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-4">
          <span className="mr-2 text-sm font-medium">Cambiar estado:</span>
          {opciones.map((op) => (
            <Button
              key={op}
              variant={op === "cancelado" ? "destructive" : "default"}
              size="sm"
              disabled={pending !== null}
              onClick={() => setConfirming(op)}
            >
              {pending === op ? "Procesando…" : ESTADO_LABEL[op]}
            </Button>
          ))}
        </div>
      )}

      {opciones.length === 0 && (
        <Alert>
          <AlertDescription>
            Este pedido está en estado <b>{pedido.estado}</b> y no admite más
            cambios.
          </AlertDescription>
        </Alert>
      )}

      <AlertDialog
        open={confirming !== null}
        onOpenChange={(o) => !o && setConfirming(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirming ? ESTADO_CONFIRM_TITLE[confirming] : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirming ? ESTADO_CONFIRM_DESCRIPTION[confirming] : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending !== null}>
              Volver
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarCambio}
              disabled={pending !== null}
              className={
                confirming === "cancelado"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
            >
              {confirming ? ESTADO_CONFIRM_ACTION[confirming] : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
      <span className="tabular-nums">{USD.format(value)}</span>
    </div>
  )
}
