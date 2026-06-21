"use client"

import { Eye, House, Truck } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

import { PedidoEstadoBadge } from "./pedido-estado-badge"
import {
  useClientePedidos,
  type PedidoEstado,
  type PedidosFilters,
} from "./use-cliente-pedidos"

const DATE_FMT = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Guayaquil",
})

const USD = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" })

const TODOS = "__todos__"

function asNum(v: string | number): number {
  return typeof v === "number" ? v : Number(v)
}

export function PedidosData() {
  const [filters, setFilters] = useState<PedidosFilters>({ page: 1, perPage: 25 })
  const state = useClientePedidos(filters)
  const data = state.status === "ready" ? state.data : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-3">
        <div className="min-w-[180px] space-y-1.5">
          <Label className="xs uppercase tracking-wide text-muted-foreground">Estado</Label>
          <Select
            value={filters.estado ?? TODOS}
            onValueChange={(v) =>
              setFilters({
                ...filters,
                estado: v === TODOS ? undefined : (v as PedidoEstado),
                page: 1,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="en_camino">En camino</SelectItem>
              <SelectItem value="entregado">Entregado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {state.status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.status === "loading" ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="rounded-md border bg-card p-8 text-center text-sm text-muted-foreground">
          Aún no tienes pedidos. <Link href="/cliente/catalogo" className="text-primary underline">Explora el catálogo</Link>.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {data.data.map((p) => (
            <Link
              key={p.id}
              href={`/cliente/pedidos/${p.id}`}
              className="flex flex-col gap-2 rounded-md border bg-card p-4 transition-colors hover:bg-accent/30 sm:flex-row sm:items-center"
            >
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {p.numero_pedido}
                  </span>
                  <PedidoEstadoBadge estado={p.estado} />
                </div>
                <div className="text-sm text-muted-foreground">
                  {p.sucursal?.nombre ?? "—"} ·{" "}
                  {p.tipo_entrega === "domicilio" ? (
                    <span className="inline-flex items-center gap-1">
                      <Truck className="h-3 w-3" />
                      Envío
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <House className="h-3 w-3" />
                      Retiro
                    </span>
                  )}
                  {" · "}
                  {DATE_FMT.format(new Date(p.fecha_solicitud))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="tabular-nums text-base font-semibold">
                  {USD.format(asNum(p.total))}
                </span>
                <Button variant="ghost" size="sm">
                  <Eye className="mr-1 h-3.5 w-3.5" />
                  Ver
                </Button>
              </div>
            </Link>
          ))}
        </div>
      )}

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
