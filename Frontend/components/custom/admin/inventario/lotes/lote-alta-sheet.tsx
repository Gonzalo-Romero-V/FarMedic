"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Plus } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

import type { LookupOption } from "../_shared/use-lookups"
import { ApiError } from "@/lib/api"
import { createLote } from "./use-admin-lotes"

/** Hoy en formato YYYY-MM-DD respetando timezone local. */
function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

const schema = z.object({
  medicamento_id: z.coerce.number({ message: "Requerido" }).int().positive(),
  sucursal_id: z.coerce.number({ message: "Requerido" }).int().positive(),
  proveedor_id: z.coerce.number({ message: "Requerido" }).int().positive(),
  numero_lote: z.string().trim().min(1, "Requerido").max(100),
  fecha_vencimiento: z
    .string()
    .min(1, "Requerido")
    .refine((d) => d > todayISO(), "Debe ser posterior a hoy"),
  fecha_ingreso: z.string().min(1, "Requerido"),
  cantidad_inicial: z.coerce
    .number({ message: "Requerido" })
    .int()
    .min(1, "Debe ser ≥ 1"),
  costo_unitario: z.coerce
    .number({ message: "Requerido" })
    .nonnegative("Debe ser ≥ 0"),
})

type FormInput = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

type Props = {
  medicamentos: LookupOption[]
  sucursales: LookupOption[]
  proveedores: LookupOption[]
  onCreated: () => void
}

export function LoteAltaSheet({ medicamentos, sucursales, proveedores, onCreated }: Props) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  const form = useForm<FormInput, undefined, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      numero_lote: "",
      fecha_ingreso: todayISO(),
      cantidad_inicial: 1,
      costo_unitario: 0,
    } as FormInput,
  })

  const onSubmit = async (values: FormOutput) => {
    try {
      await createLote({ ...values, usuario_id: user?.id })
      toast.success(`Lote ${values.numero_lote} creado`)
      form.reset()
      setOpen(false)
      onCreated()
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? (err.payload as { message?: string } | undefined)?.message ??
            `Error ${err.status}`
          : err instanceof Error
            ? err.message
            : "Error al crear lote"
      toast.error(msg)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo lote
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Nuevo lote</SheetTitle>
          <SheetDescription>
            Crea un lote y registra automáticamente el movimiento de ingreso en el Kardex.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4"
          >
            <FormField
              control={form.control}
              name="medicamento_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medicamento</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {medicamentos.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sucursal_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sucursal</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sucursales.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proveedor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proveedor</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {proveedores.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numero_lote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de lote</FormLabel>
                  <FormControl>
                    <Input placeholder="L-2026-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="fecha_ingreso"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de ingreso</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fecha_vencimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimiento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="cantidad_inicial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad inicial</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        {...field}
                        value={(field.value as number | string | undefined) ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="costo_unitario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo unitario (USD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        {...field}
                        value={(field.value as number | string | undefined) ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
        <SheetFooter className="flex-row gap-2 border-t bg-muted/30 p-4">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={form.formState.isSubmitting}
            className="flex-1"
          >
            {form.formState.isSubmitting ? "Creando..." : "Crear lote"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
