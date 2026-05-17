"use client"

import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import { CheckoutDialog } from "./checkout-dialog"
import {
  calcularTotales,
  type CartItem,
  type PedidoResponse,
} from "./use-catalogo"

type Props = {
  items: CartItem[]
  ivaTasa: number
  totalItems: number
  requiereReceta: boolean
  onSetCantidad: (medicamentoId: number, cantidad: number) => void
  onRemove: (medicamentoId: number) => void
  onClear: () => void
  onPedidoCreado: (pedido: PedidoResponse) => void
}

export function CartSheet({
  items,
  ivaTasa,
  totalItems,
  requiereReceta,
  onSetCantidad,
  onRemove,
  onClear,
  onPedidoCreado,
}: Props) {
  const [open, setOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const { subtotal, impuesto, total } = calcularTotales(items, ivaTasa)

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="relative">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Carrito
            {totalItems > 0 && (
              <Badge className="absolute -right-2 -top-2 h-5 min-w-5 rounded-full px-1.5">
                {totalItems}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle>Tu carrito</SheetTitle>
            <SheetDescription>
              {items.length === 0
                ? "Está vacío — agregá productos desde el catálogo."
                : `${totalItems} producto${totalItems === 1 ? "" : "s"} para confirmar.`}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-2">
            {items.map((it) => (
              <div
                key={it.medicamento.id}
                className="flex flex-col gap-2 rounded-md border bg-card p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {it.medicamento.nombre_comercial}
                      </span>
                      {it.medicamento.requiere_receta && (
                        <Badge variant="outline" className="border-amber-300 text-amber-700">
                          Receta
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${Number(it.medicamento.precio).toFixed(2)} c/u
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(it.medicamento.id)}
                    aria-label="Quitar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onSetCantidad(it.medicamento.id, it.cantidad - 1)}
                      aria-label="Restar"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      max={it.medicamento.stock_disponible}
                      value={it.cantidad}
                      onChange={(e) =>
                        onSetCantidad(it.medicamento.id, Number(e.target.value) || 0)
                      }
                      className="h-7 w-16 text-center tabular-nums"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onSetCantidad(it.medicamento.id, it.cantidad + 1)}
                      disabled={it.cantidad >= it.medicamento.stock_disponible}
                      aria-label="Sumar"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="text-sm tabular-nums font-medium">
                    ${(Number(it.medicamento.precio) * it.cantidad).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {items.length > 0 && (
            <div className="border-t bg-muted/40 px-4 py-3 text-sm">
              <Row label="Subtotal" value={subtotal} />
              <Row label={`IVA (${ivaTasa.toFixed(2)}%)`} value={impuesto} />
              <div className="mt-2 flex items-center justify-between border-t pt-2 font-semibold">
                <span>Total</span>
                <span className="tabular-nums">${total.toFixed(2)}</span>
              </div>
            </div>
          )}

          <SheetFooter className="flex-row gap-2 border-t bg-muted/30 p-4">
            <Button
              variant="outline"
              onClick={onClear}
              disabled={items.length === 0}
              className="flex-1"
            >
              Vaciar
            </Button>
            <Button
              onClick={() => setCheckoutOpen(true)}
              disabled={items.length === 0}
              className="flex-1"
            >
              Confirmar pedido
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        items={items}
        ivaTasa={ivaTasa}
        requiereReceta={requiereReceta}
        onPedidoCreado={(pedido) => {
          setCheckoutOpen(false)
          setOpen(false)
          onPedidoCreado(pedido)
        }}
      />
    </>
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
