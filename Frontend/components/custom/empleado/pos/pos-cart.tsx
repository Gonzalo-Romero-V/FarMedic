"use client"

import { Minus, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { calcularTotales, type CartItem } from "./use-pos"

type Props = {
  items: CartItem[]
  ivaTasa: number
  onSetCantidad: (medicamentoId: number, cantidad: number) => void
  onRemove: (medicamentoId: number) => void
}

export function PosCart({ items, ivaTasa, onSetCantidad, onRemove }: Props) {
  const { subtotal, impuesto, total } = calcularTotales(items, ivaTasa)

  return (
    <div className="flex flex-col">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">Carrito ({items.length})</h2>
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-muted-foreground">
          Agregá medicamentos desde la búsqueda.
        </div>
      ) : (
        <ul className="divide-y">
          {items.map((it) => {
            const subtotalItem = it.medicamento.precio * it.cantidad
            return (
              <li key={it.medicamento.id} className="flex flex-col gap-2 px-4 py-3">
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
                      ${it.medicamento.precio.toFixed(2)} c/u
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
                      max={it.medicamento.stock_actual}
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
                      disabled={it.cantidad >= it.medicamento.stock_actual}
                      aria-label="Sumar"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="text-sm tabular-nums font-medium">
                    ${subtotalItem.toFixed(2)}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}

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
