"use client"

import { Check, User, X } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"

import type { PosClienteOption } from "./use-pos"
import { usePosClientes } from "./use-pos-clientes"

type Props = {
  value: PosClienteOption | null
  onChange: (cliente: PosClienteOption | null) => void
}

export function PosClienteSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const state = usePosClientes(query)

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="justify-start gap-2">
            <User className="h-3.5 w-3.5" />
            {value ? value.nombre : "Consumidor final"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <div className="border-b p-2">
            <Input
              autoFocus
              placeholder="Buscar por nombre o email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="max-h-64 overflow-auto">
            {state.status === "loading" && (
              <div className="flex flex-col gap-1 p-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            )}
            {state.status === "error" && (
              <div className="p-3 text-xs text-destructive">{state.error}</div>
            )}
            {state.status === "ready" && state.results.length === 0 && (
              <div className="p-3 text-xs text-muted-foreground">
                Sin clientes registrados que coincidan.
              </div>
            )}
            {state.status === "ready" && state.results.length > 0 && (
              <ul className="py-1">
                {state.results.map((c) => {
                  const selected = value?.id === c.id
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(c)
                          setOpen(false)
                          setQuery("")
                        }}
                        className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm hover:bg-muted"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{c.nombre}</div>
                          <div className="truncate text-xs text-muted-foreground">{c.email}</div>
                        </div>
                        {selected && <Check className="h-3.5 w-3.5 text-primary" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onChange(null)}
          aria-label="Quitar cliente"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
