"use client"

import { House, Truck } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import type { RecetaResponse } from "@/components/custom/empleado/pos/use-pos"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ApiError } from "@/lib/api"

import { RecetaBlock } from "./receta-block"
import {
  calcularTotales,
  crearPedido,
  fetchSucursalesActivas,
  type CartItem,
  type PedidoResponse,
  type PedidoTipoEntrega,
  type SucursalOption,
} from "./use-catalogo"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CartItem[]
  ivaTasa: number
  requiereReceta: boolean
  onPedidoCreado: (pedido: PedidoResponse) => void
}

export function CheckoutDialog({
  open,
  onOpenChange,
  items,
  ivaTasa,
  requiereReceta,
  onPedidoCreado,
}: Props) {
  const [sucursales, setSucursales] = useState<SucursalOption[]>([])
  const [sucursalId, setSucursalId] = useState<number | null>(null)
  const [tipoEntrega, setTipoEntrega] = useState<PedidoTipoEntrega>("retiro_local")
  const [direccion, setDireccion] = useState("")
  const [telefono, setTelefono] = useState("")
  const [recetaId, setRecetaId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    fetchSucursalesActivas()
      .then((s) => {
        setSucursales(s)
        if (s.length === 1) setSucursalId(s[0].id)
      })
      .catch(() => setSucursales([]))
  }, [open])

  useEffect(() => {
    // Si el carrito deja de requerir receta, limpiar receta_id.
    if (!requiereReceta && recetaId !== null) setRecetaId(null)
  }, [requiereReceta, recetaId])

  const totales = calcularTotales(items, ivaTasa)
  const bloqueado =
    !sucursalId ||
    !telefono.trim() ||
    (tipoEntrega === "domicilio" && !direccion.trim()) ||
    (requiereReceta && recetaId === null)

  const handleConfirmar = async () => {
    if (bloqueado || !sucursalId) return
    setSubmitting(true)
    try {
      const pedido = await crearPedido({
        sucursal_id: sucursalId,
        receta_id: recetaId,
        tipo_entrega: tipoEntrega,
        direccion_envio: tipoEntrega === "domicilio" ? direccion.trim() : null,
        telefono_contacto: telefono.trim(),
        items: items.map((it) => ({
          medicamento_id: it.medicamento.id,
          cantidad: it.cantidad,
        })),
      })
      toast.success(`Pedido ${pedido.numero_pedido} confirmado`)
      onPedidoCreado(pedido)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? (err.payload as { message?: string } | undefined)?.message ?? `Error ${err.status}`
          : err instanceof Error
            ? err.message
            : "Error al confirmar pedido"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirmar pedido</DialogTitle>
          <DialogDescription>
            Elige dónde retirarlo o que te lo enviemos. La sucursal valida el stock al confirmar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Sucursal</Label>
            <Select
              value={sucursalId ? String(sucursalId) : undefined}
              onValueChange={(v) => setSucursalId(Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {sucursales.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.nombre} · {s.ciudad}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Tipo de entrega</Label>
            <RadioGroup
              value={tipoEntrega}
              onValueChange={(v) => setTipoEntrega(v as PedidoTipoEntrega)}
              className="grid grid-cols-2 gap-2"
            >
              <label className="flex cursor-pointer items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm hover:bg-accent">
                <RadioGroupItem value="retiro_local" />
                <House className="h-3.5 w-3.5" />
                Retiro en sucursal
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm hover:bg-accent">
                <RadioGroupItem value="domicilio" />
                <Truck className="h-3.5 w-3.5" />
                Envío a domicilio
              </label>
            </RadioGroup>
          </div>

          {tipoEntrega === "domicilio" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dir">Dirección de envío</Label>
              <Input
                id="dir"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Calle, número, referencias"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tel">Teléfono de contacto</Label>
            <Input
              id="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="0999..."
            />
          </div>

          {requiereReceta && (
            <RecetaBlock
              recetaId={recetaId}
              onRecetaCreada={(r) => setRecetaId(r.id)}
              onLimpiar={() => setRecetaId(null)}
            />
          )}

          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <Row label="Subtotal" value={`$${totales.subtotal.toFixed(2)}`} />
            <Row label={`IVA (${ivaTasa.toFixed(2)}%)`} value={`$${totales.impuesto.toFixed(2)}`} />
            <div className="mt-1 flex items-center justify-between border-t pt-1 font-semibold">
              <span>Total</span>
              <span className="tabular-nums">${totales.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} disabled={submitting || bloqueado}>
            {submitting ? "Procesando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}
