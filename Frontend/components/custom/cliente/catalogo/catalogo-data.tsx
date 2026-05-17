"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import { CartSheet } from "./cart-sheet"
import { CatalogoFiltersBar } from "./catalogo-filters"
import { CatalogoGrid } from "./catalogo-grid"
import {
  fetchIvaTasa,
  useCart,
  useCatalogo,
  type CatalogoFilters,
} from "./use-catalogo"

export function CatalogoData() {
  const router = useRouter()
  const [filters, setFilters] = useState<CatalogoFilters>({ page: 1, perPage: 24 })
  const [ivaTasa, setIvaTasa] = useState(0)
  const state = useCatalogo(filters)
  const cart = useCart()

  useEffect(() => {
    fetchIvaTasa()
      .then(setIvaTasa)
      .catch(() => setIvaTasa(0))
  }, [])

  const data = state.status === "ready" ? state.data : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <CatalogoFiltersBar filters={filters} onChange={setFilters} />
        <CartSheet
          items={cart.items}
          ivaTasa={ivaTasa}
          totalItems={cart.totalItems}
          requiereReceta={cart.requiereReceta}
          onSetCantidad={cart.setCantidad}
          onRemove={cart.removeItem}
          onClear={cart.clear}
          onPedidoCreado={(pedido) => {
            cart.clear()
            router.push(`/cliente/pedidos/${pedido.id}`)
          }}
        />
      </div>

      {state.status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <CatalogoGrid
        items={data?.data}
        loading={state.status === "loading"}
        onAdd={cart.addItem}
      />

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {data.from ?? 0}-{data.to ?? 0} de {data.total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.current_page <= 1}
              onClick={() => setFilters({ ...filters, page: data.current_page - 1 })}
            >
              Anterior
            </Button>
            <span className="text-xs text-muted-foreground">
              Página {data.current_page} de {data.last_page}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={data.current_page >= data.last_page}
              onClick={() => setFilters({ ...filters, page: data.current_page + 1 })}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
