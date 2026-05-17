"use client"

import { Download } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"

import { descargarComprobantePdf, type VentaResponse } from "../pos/use-pos"
import { fetchVentaDetalle } from "./use-empleado-ventas"

type Props = {
  ventaId: number | null
  onClose: () => void
}

function asNum(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0
  return typeof v === "number" ? v : Number(v)
}

export function VentaDetalleDialog({ ventaId, onClose }: Props) {
  const [venta, setVenta] = useState<VentaResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [descargando, setDescargando] = useState(false)

  const handleDescargar = async () => {
    if (!venta) return
    setDescargando(true)
    try {
      await descargarComprobantePdf(venta.id, venta.numero_comprobante)
      toast.success("Comprobante descargado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al descargar")
    } finally {
      setDescargando(false)
    }
  }

  useEffect(() => {
    if (ventaId === null) {
      setVenta(null)
      return
    }
    const ctrl = new AbortController()
    setLoading(true)
    fetchVentaDetalle(ventaId)
      .then((v) => setVenta(v))
      .catch(() => setVenta(null))
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [ventaId])

  return (
    <Dialog open={ventaId !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Venta {venta ? venta.numero_comprobante : ""}
          </DialogTitle>
          <DialogDescription>
            {venta && new Date(venta.fecha).toLocaleString("es-EC", { timeZone: "America/Guayaquil" })}
          </DialogDescription>
        </DialogHeader>

        {loading || !venta ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Cliente" value={venta.cliente?.nombre ?? "Consumidor final"} />
              <Field label="Método" value={<span className="capitalize">{venta.metodo_pago}</span>} />
              <Field label="Atendió" value={venta.usuario?.nombre ?? `#${venta.usuario_id}`} />
              <Field
                label="Estado"
                value={
                  <Badge
                    variant="outline"
                    className={
                      venta.estado === "anulada"
                        ? "border-destructive/40 text-destructive"
                        : "border-emerald-300 text-emerald-700"
                    }
                  >
                    {venta.estado}
                  </Badge>
                }
              />
              {venta.receta_id && <Field label="Receta" value={`#${venta.receta_id}`} />}
            </div>

            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-2 py-1.5 text-left">Item</th>
                    <th className="px-2 py-1.5 text-right">Cant.</th>
                    <th className="px-2 py-1.5 text-right">P. Unit</th>
                    <th className="px-2 py-1.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {venta.items.map((it) => (
                    <tr key={it.id} className="border-t">
                      <td className="px-2 py-1.5">
                        {it.lote?.medicamento?.nombre_comercial ?? `Lote #${it.lote_id}`}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{it.cantidad}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">
                        ${asNum(it.precio_unitario).toFixed(2)}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">
                        ${asNum(it.subtotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-0.5">
              <TotalRow label="Subtotal" value={asNum(venta.subtotal)} />
              <TotalRow
                label={`IVA (${asNum(venta.iva_tasa_aplicada).toFixed(2)}%)`}
                value={asNum(venta.impuesto_total)}
              />
              <div className="flex items-center justify-between border-t pt-1.5 text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">${asNum(venta.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {venta && (
          <DialogFooter>
            <Button onClick={handleDescargar} disabled={descargando}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              {descargando ? "Generando…" : "Descargar PDF"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div>{value}</div>
    </div>
  )
}

function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>{label}</span>
      <span className="tabular-nums">${value.toFixed(2)}</span>
    </div>
  )
}
