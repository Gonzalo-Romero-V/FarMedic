"use client"

import { LogIn, Search } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

import {
  useCatalogoPublico,
  type CatalogoPublicoFilters,
} from "./use-catalogo-publico"

const USD = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" })
const SKELETON_COUNT = 8

export function CatalogoPublicoData() {
  const [filters, setFilters] = useState<CatalogoPublicoFilters>({ page: 1, perPage: 24 })
  const state = useCatalogoPublico(filters)
  const data = state.status === "ready" ? state.data : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o principio activo..."
            value={filters.q ?? ""}
            onChange={(e) => setFilters({ ...filters, q: e.target.value, page: 1 })}
            className="pl-9"
          />
        </div>
        <Button asChild>
          <Link href="/login">
            <LogIn className="mr-2 h-4 w-4" />
            Inicia sesión para comprar
          </Link>
        </Button>
      </div>

      {state.status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.status === "loading" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="rounded-md border bg-card p-8 text-center text-sm text-muted-foreground">
          Sin medicamentos para tu búsqueda.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.data.map((med) => (
            <Card key={med.id} size="sm">
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">{med.nombre_comercial}</h3>
                    <p className="xs text-muted-foreground">{med.principio_activo}</p>
                  </div>
                  {med.requiere_receta && (
                    <Badge variant="outline" className="border-amber-300 text-amber-700">
                      Receta
                    </Badge>
                  )}
                </div>
                <div className="xs text-muted-foreground">{med.categoria?.nombre ?? ""}</div>
                <div className="flex items-end justify-between pt-2">
                  <span className="h3 tabular-nums">{USD.format(Number(med.precio))}</span>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/login">Comprar</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
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
