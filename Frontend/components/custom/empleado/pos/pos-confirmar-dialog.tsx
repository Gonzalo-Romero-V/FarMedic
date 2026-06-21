"use client"

import { CreditCard, Wallet } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ApiError } from "@/lib/api"

import {
  calcularTotales,
  crearVenta,
  type CartItem,
  type MetodoPago,
  type PosClienteOption,
  type VentaResponse,
} from "./use-pos"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CartItem[]
  ivaTasa: number
  cliente: PosClienteOption | null
  recetaId: number | null
  requiereReceta: boolean
  onConfirmada: (venta: VentaResponse) => void
}

const METODOS: { value: MetodoPago; label: string; icon: React.ReactNode }[] = [
  { value: "efectivo", label: "Efectivo", icon: <Wallet className="h-3.5 w-3.5" /> },
  { value: "tarjeta", label: "Tarjeta", icon: <CreditCard className="h-3.5 w-3.5" /> },
  { value: "transferencia", label: "Transferencia", icon: <Wallet className="h-3.5 w-3.5" /> },
]

export function PosConfirmarDialog({
  open,
  onOpenChange,
  items,
  ivaTasa,
  cliente,
  recetaId,
  requiereReceta,
  onConfirmada,
}: Props) {
  const [metodo, setMetodo] = useState<MetodoPago>("efectivo")
  const [submitting, setSubmitting] = useState(false)
  const totales = calcularTotales(items, ivaTasa)

  const bloqueado = requiereReceta && recetaId === null

  const handleConfirmar = async () => {
    if (bloqueado) return
    setSubmitting(true)
    try {
      const venta = await crearVenta({
        cliente_id: cliente?.id ?? null,
        receta_id: recetaId,
        metodo_pago: metodo,
        items: items.map((it) => ({
          medicamento_id: it.medicamento.id,
          cantidad: it.cantidad,
          ...(it.descuento > 0 ? { descuento_item: it.descuento } : {}),
        })),
      })
      toast.success(`Venta ${venta.numero_comprobante} registrada`)
      onConfirmada(venta)
      onOpenChange(false)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? (err.payload as { message?: string } | undefined)?.message ?? `Error ${err.status}`
          : err instanceof Error
            ? err.message
            : "Error al confirmar venta"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar venta</DialogTitle>
          <DialogDescription>
            Elige el método de pago. El descuento de stock es automático (FEFO).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <Row label="Items" value={`${items.length}`} />
            {totales.descuentos > 0 && (
              <>
                <Row label="Bruto" value={`$${totales.bruto.toFixed(2)}`} />
                <Row label="Descuentos" value={`−$${totales.descuentos.toFixed(2)}`} />
              </>
            )}
            <Row label="Subtotal" value={`$${totales.subtotal.toFixed(2)}`} />
            <Row label={`IVA (${ivaTasa.toFixed(2)}%)`} value={`$${totales.impuesto.toFixed(2)}`} />
            <div className="mt-2 flex items-center justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <span className="tabular-nums">${totales.total.toFixed(2)}</span>
            </div>
            <Row label="Cliente" value={cliente ? cliente.nombre : "Consumidor final"} />
            {requiereReceta && (
              <Row
                label="Receta"
                value={recetaId ? `#${recetaId}` : "FALTA"}
                emphasize={!recetaId}
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Método de pago</Label>
            <RadioGroup
              value={metodo}
              onValueChange={(v) => setMetodo(v as MetodoPago)}
              className="grid grid-cols-3 gap-2"
            >
              {METODOS.map((m) => (
                <label
                  key={m.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm hover:bg-accent"
                >
                  <RadioGroupItem value={m.value} />
                  {m.icon}
                  {m.label}
                </label>
              ))}
            </RadioGroup>
          </div>

          {bloqueado && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              Adjunta una receta antes de confirmar.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} disabled={submitting || bloqueado}>
            {submitting ? "Procesando..." : `Cobrar $${totales.total.toFixed(2)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={emphasize ? "font-medium text-destructive" : "tabular-nums"}>{value}</span>
    </div>
  )
}
