"use client"

import { Minus, Percent, Plus, Trash2 } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { calcularTotales, type CartItem } from "./use-pos"

type Props = {
  items: CartItem[]
  ivaTasa: number
  onSetCantidad: (medicamentoId: number, cantidad: number) => void
  onSetDescuento: (medicamentoId: number, descuento: number) => void
  onRemove: (medicamentoId: number) => void
}

export function PosCart({
  items,
  ivaTasa,
  onSetCantidad,
  onSetDescuento,
  onRemove,
}: Props) {
  const { bruto, descuentos, subtotal, impuesto, total } = calcularTotales(items, ivaTasa)
  const [editandoDescuento, setEditandoDescuento] = useState<number | null>(null)

  return (
    <div className="flex flex-col">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold">Carrito ({items.length})</h2>
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-muted-foreground">
          Agrega medicamentos desde la búsqueda.
        </div>
      ) : (
        <ul className="divide-y">
          {items.map((it) => {
            const brutoItem = it.medicamento.precio * it.cantidad
            const netoItem = Math.max(0, brutoItem - it.descuento)
            const mostrarEditor = editandoDescuento === it.medicamento.id || it.descuento > 0
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
                  <div className="flex flex-col items-end gap-0.5">
                    {it.descuento > 0 && (
                      <span className="text-[10px] tabular-nums text-muted-foreground line-through">
                        ${brutoItem.toFixed(2)}
                      </span>
                    )}
                    <span className="text-sm tabular-nums font-medium">
                      ${netoItem.toFixed(2)}
                    </span>
                  </div>
                </div>

                {mostrarEditor ? (
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor={`desc-${it.medicamento.id}`}
                      className="text-xs text-muted-foreground"
                    >
                      Descuento
                    </Label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        $
                      </span>
                      <Input
                        id={`desc-${it.medicamento.id}`}
                        type="number"
                        min={0}
                        max={brutoItem}
                        step="0.01"
                        value={it.descuento || ""}
                        placeholder="0.00"
                        onChange={(e) =>
                          onSetDescuento(it.medicamento.id, Number(e.target.value) || 0)
                        }
                        onBlur={() => {
                          if (it.descuento === 0) setEditandoDescuento(null)
                        }}
                        className="h-7 w-24 pl-5 text-right tabular-nums"
                      />
                    </div>
                    {it.descuento > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          onSetDescuento(it.medicamento.id, 0)
                          setEditandoDescuento(null)
                        }}
                        className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditandoDescuento(it.medicamento.id)}
                    className="inline-flex items-center self-start gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Percent className="h-3 w-3" />
                    Agregar descuento
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {items.length > 0 && (
        <div className="border-t bg-muted/40 px-4 py-3 text-sm">
          {descuentos > 0 && (
            <>
              <Row label="Bruto" value={bruto} />
              <Row label="Descuentos" value={-descuentos} />
            </>
          )}
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
  const signo = value < 0 ? "−" : ""
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="tabular-nums">
        {signo}${Math.abs(value).toFixed(2)}
      </span>
    </div>
  )
}
