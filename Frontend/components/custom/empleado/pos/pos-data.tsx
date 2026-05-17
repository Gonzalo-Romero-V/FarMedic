"use client"

import { ShoppingCart } from "lucide-react"
import { useEffect, useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import { PosCart } from "./pos-cart"
import { PosClienteSelector } from "./pos-cliente-selector"
import { PosComprobanteDialog } from "./pos-comprobante-dialog"
import { PosConfirmarDialog } from "./pos-confirmar-dialog"
import {
  PosRecetaBlock,
  useResetRecetaSiNoEsRequerida,
} from "./pos-receta-block"
import { PosSearch } from "./pos-search"
import {
  fetchIvaTasa,
  usePosCart,
  type PosClienteOption,
  type VentaResponse,
} from "./use-pos"

/**
 * Island root del POS empleado. El backend resuelve sucursal_id desde auth(); el
 * frontend no la maneja.
 *
 * Flujo:
 *   1. Buscar y agregar al carrito.
 *   2. (Opcional) elegir cliente registrado.
 *   3. (Condicional) adjuntar receta si algún item la requiere.
 *   4. Confirmar — backend descuenta lote FEFO + Kardex auto.
 *   5. Mostrar comprobante imprimible y limpiar carrito para la siguiente venta.
 */
export function PosData() {
  const cart = usePosCart()
  const [cliente, setCliente] = useState<PosClienteOption | null>(null)
  const [recetaId, setRecetaId] = useState<number | null>(null)
  const [ivaTasa, setIvaTasa] = useState<number>(0)
  const [confirmarOpen, setConfirmarOpen] = useState(false)
  const [comprobante, setComprobante] = useState<VentaResponse | null>(null)
  const [errorIva, setErrorIva] = useState<string | null>(null)

  useEffect(() => {
    fetchIvaTasa()
      .then((t) => setIvaTasa(t))
      .catch(() => setErrorIva("No se pudo leer la tasa de IVA de la farmacia"))
  }, [])

  useResetRecetaSiNoEsRequerida(cart.requiereReceta, recetaId, setRecetaId)

  const puedeConfirmar =
    cart.items.length > 0 && (!cart.requiereReceta || recetaId !== null)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-4">
        {errorIva && (
          <Alert variant="destructive">
            <AlertDescription>{errorIva}</AlertDescription>
          </Alert>
        )}

        <PosSearch onAdd={cart.addItem} />

        {cart.requiereReceta && (
          <PosRecetaBlock
            recetaId={recetaId}
            onRecetaCreada={(r) => setRecetaId(r.id)}
            onLimpiar={() => setRecetaId(null)}
          />
        )}
      </div>

      <aside className="flex flex-col rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <PosClienteSelector value={cliente} onChange={setCliente} />
        </div>

        <PosCart
          items={cart.items}
          ivaTasa={ivaTasa}
          onSetCantidad={cart.setCantidad}
          onSetDescuento={cart.setDescuento}
          onRemove={cart.removeItem}
        />

        <div className="border-t p-3">
          <Button
            className="w-full"
            size="lg"
            disabled={!puedeConfirmar}
            onClick={() => setConfirmarOpen(true)}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Confirmar venta
          </Button>
        </div>
      </aside>

      <PosConfirmarDialog
        open={confirmarOpen}
        onOpenChange={setConfirmarOpen}
        items={cart.items}
        ivaTasa={ivaTasa}
        cliente={cliente}
        recetaId={recetaId}
        requiereReceta={cart.requiereReceta}
        onConfirmada={(venta) => {
          setComprobante(venta)
          cart.clear()
          setCliente(null)
          setRecetaId(null)
        }}
      />

      <PosComprobanteDialog
        open={comprobante !== null}
        onOpenChange={(o) => !o && setComprobante(null)}
        venta={comprobante}
        onCerrar={() => setComprobante(null)}
      />
    </div>
  )
}
