"use client"

import { Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import type { VentaResponse } from "./use-pos"

/**
 * Comprobante imprimible (placeholder de RF-08; el PDF real queda para otra tanda).
 * Usa `window.print()` con CSS `@media print` que oculta el chrome y muestra solo
 * el contenido del comprobante. Se imprime la página completa con `print:hidden`
 * en todo menos el contenedor con id="pos-comprobante-printable".
 */

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  venta: VentaResponse | null
  onCerrar: () => void
}

function asNum(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0
  return typeof v === "number" ? v : Number(v)
}

export function PosComprobanteDialog({ open, onOpenChange, venta, onCerrar }: Props) {
  if (!venta) return null

  const fecha = new Date(venta.fecha)

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) onCerrar()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="print:hidden">
          <DialogTitle>Venta confirmada</DialogTitle>
        </DialogHeader>

        <div id="pos-comprobante-printable" className="text-sm">
          <div className="mb-3 border-b pb-3 text-center">
            <div className="text-base font-semibold">Comprobante de venta</div>
            <div className="text-xs text-muted-foreground">N° {venta.numero_comprobante}</div>
            <div className="text-xs text-muted-foreground">
              {fecha.toLocaleString("es-EC", { timeZone: "America/Guayaquil" })}
            </div>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-1 text-xs">
            <span className="text-muted-foreground">Atendido por</span>
            <span className="text-right">{venta.usuario?.nombre ?? `#${venta.usuario_id}`}</span>
            <span className="text-muted-foreground">Cliente</span>
            <span className="text-right">{venta.cliente?.nombre ?? "Consumidor final"}</span>
            <span className="text-muted-foreground">Método</span>
            <span className="text-right capitalize">{venta.metodo_pago}</span>
            {venta.receta_id && (
              <>
                <span className="text-muted-foreground">Receta</span>
                <span className="text-right">#{venta.receta_id}</span>
              </>
            )}
          </div>

          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b">
                <th className="py-1 text-left">Item</th>
                <th className="py-1 text-right">Cant.</th>
                <th className="py-1 text-right">P. Unit</th>
                <th className="py-1 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {venta.items.map((it) => (
                <tr key={it.id} className="border-b last:border-0">
                  <td className="py-1">
                    {it.lote?.medicamento?.nombre_comercial ?? `Lote #${it.lote_id}`}
                  </td>
                  <td className="py-1 text-right tabular-nums">{it.cantidad}</td>
                  <td className="py-1 text-right tabular-nums">
                    ${asNum(it.precio_unitario).toFixed(2)}
                  </td>
                  <td className="py-1 text-right tabular-nums">
                    ${asNum(it.subtotal).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 space-y-0.5 border-t pt-2 text-xs">
            <Row label="Subtotal" value={asNum(venta.subtotal)} />
            <Row
              label={`IVA (${asNum(venta.iva_tasa_aplicada).toFixed(2)}%)`}
              value={asNum(venta.impuesto_total)}
            />
            <div className="mt-1 flex items-center justify-between border-t pt-1 text-sm font-semibold">
              <span>Total</span>
              <span className="tabular-nums">${asNum(venta.total).toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4 text-center text-[10px] text-muted-foreground">
            ¡Gracias por su compra!
          </div>
        </div>

        <DialogFooter className="print:hidden">
          <Button variant="outline" onClick={onCerrar}>
            Cerrar
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
