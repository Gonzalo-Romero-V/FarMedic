"use client"

import { Package, Receipt } from "lucide-react"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import {
  fetchClienteDetalle,
  type ClienteDetalle,
} from "./use-empleado-clientes"

type Props = {
  clienteId: number | null
  onClose: () => void
}

const DATE_TIME = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Guayaquil",
})

const DATE_ONLY = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

function asNum(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0
  return typeof v === "number" ? v : Number(v)
}

const PEDIDO_BADGE: Record<string, string> = {
  pendiente: "border-amber-300 text-amber-700",
  en_camino: "border-sky-300 text-sky-700",
  entregado: "border-emerald-300 text-emerald-700",
  cancelado: "border-destructive/40 text-destructive",
}

export function ClienteHistorialDrawer({ clienteId, onClose }: Props) {
  const [data, setData] = useState<ClienteDetalle | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (clienteId === null) {
      setData(null)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    fetchClienteDetalle(clienteId)
      .then(setData)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Error al cargar historial"),
      )
      .finally(() => setLoading(false))
  }, [clienteId])

  return (
    <Sheet open={clienteId !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{data?.cliente.nombre ?? "Cliente"}</SheetTitle>
          <SheetDescription>
            {data?.cliente.email}
            {data?.cliente.created_at && (
              <>
                {" · "}cliente desde {DATE_ONLY.format(new Date(data.cliente.created_at))}
              </>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-6">
          {loading && (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {data && !loading && (
            <>
              <Section
                title="Ventas en tu sucursal"
                icon={<Receipt className="h-4 w-4 text-primary" />}
                empty="Sin ventas registradas en tu sucursal."
                count={data.ventas.length}
              >
                {data.ventas.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between gap-3 border-t py-2 first:border-t-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-mono text-xs text-muted-foreground">
                          {v.numero_comprobante}
                        </span>
                        {v.estado === "anulada" && (
                          <Badge
                            variant="outline"
                            className="border-destructive/40 text-destructive"
                          >
                            anulada
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {DATE_TIME.format(new Date(v.fecha))} ·{" "}
                        <span className="capitalize">{v.metodo_pago}</span>
                      </div>
                    </div>
                    <span className="text-sm tabular-nums font-medium">
                      ${asNum(v.total).toFixed(2)}
                    </span>
                  </li>
                ))}
              </Section>

              <Section
                title="Pedidos online"
                icon={<Package className="h-4 w-4 text-primary" />}
                empty="Sin pedidos online registrados."
                count={data.pedidos.length}
              >
                {data.pedidos.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 border-t py-2 first:border-t-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-mono text-xs text-muted-foreground">
                          {p.numero_pedido}
                        </span>
                        <Badge variant="outline" className={PEDIDO_BADGE[p.estado] ?? ""}>
                          {p.estado}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.fecha_solicitud && DATE_TIME.format(new Date(p.fecha_solicitud))}
                      </div>
                    </div>
                    <span className="text-sm tabular-nums font-medium">
                      ${asNum(p.total).toFixed(2)}
                    </span>
                  </li>
                ))}
              </Section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Section({
  title,
  icon,
  empty,
  count,
  children,
}: {
  title: string
  icon: React.ReactNode
  empty: string
  count: number
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
        <span className="text-xs font-normal text-muted-foreground">({count})</span>
      </h3>
      {count === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="rounded-md border bg-card px-3">{children}</ul>
      )}
    </div>
  )
}
