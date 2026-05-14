"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
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
import { Switch } from "@/components/ui/switch"
import { ApiError } from "@/lib/api"

import type { LookupOption } from "../_shared/use-lookups"
import { createMedicamento } from "./use-admin-catalogo"

const schema = z.object({
  sucursal_id: z.coerce.number({ message: "Requerido" }).int().positive(),
  categoria_id: z.coerce.number({ message: "Requerido" }).int().positive(),
  proveedor_id: z.coerce.number({ message: "Requerido" }).int().positive(),
  nombre_comercial: z.string().trim().min(1, "Requerido").max(255),
  principio_activo: z.string().trim().min(1, "Requerido").max(255),
  codigo_barras: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => (v ? v : undefined)),
  precio: z.coerce.number({ message: "Requerido" }).nonnegative("Debe ser ≥ 0"),
  stock_minimo: z.coerce
    .number({ message: "Requerido" })
    .int()
    .min(0, "Debe ser ≥ 0"),
  ubicacion_fisica: z.string().trim().min(1, "Requerido").max(100),
  requiere_receta: z.boolean(),
  activo: z.boolean(),
})

type FormInput = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

type Props = {
  sucursales: LookupOption[]
  categorias: LookupOption[]
  proveedores: LookupOption[]
  onCreated: () => void
}

export function MedicamentoAltaSheet({ sucursales, categorias, proveedores, onCreated }: Props) {
  const [open, setOpen] = useState(false)

  const form = useForm<FormInput, undefined, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre_comercial: "",
      principio_activo: "",
      codigo_barras: "",
      precio: 0,
      stock_minimo: 0,
      ubicacion_fisica: "",
      requiere_receta: false,
      activo: true,
    } as FormInput,
  })

  const onSubmit = async (values: FormOutput) => {
    try {
      await createMedicamento({
        ...values,
        codigo_barras: values.codigo_barras ?? null,
      })
      toast.success(`Medicamento ${values.nombre_comercial} creado`)
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
            : "Error al crear medicamento"
      toast.error(msg)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo medicamento
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Nuevo medicamento</SheetTitle>
          <SheetDescription>
            Alta del producto en el catálogo. El stock no se setea acá — se carga después con lotes.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4"
          >
            <FormField
              control={form.control}
              name="nombre_comercial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre comercial</FormLabel>
                  <FormControl>
                    <Input placeholder="Paracetamol 500mg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="principio_activo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Principio activo</FormLabel>
                  <FormControl>
                    <Input placeholder="Paracetamol" {...field} />
                  </FormControl>
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

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="categoria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
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
                        {categorias.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.label}
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="precio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio (USD)</FormLabel>
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
              <FormField
                control={form.control}
                name="stock_minimo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock mínimo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        {...field}
                        value={(field.value as number | string | undefined) ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="codigo_barras"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de barras</FormLabel>
                  <FormControl>
                    <Input placeholder="Opcional" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>Único por sucursal cuando se provee.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ubicacion_fisica"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación física</FormLabel>
                  <FormControl>
                    <Input placeholder="Estantería A, Cajón 3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="requiere_receta"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                    <FormLabel className="space-y-1">
                      <div>Requiere receta</div>
                      <div className="xs font-normal text-muted-foreground">
                        Bloquea venta sin receta
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="activo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                    <FormLabel className="space-y-1">
                      <div>Activo</div>
                      <div className="xs font-normal text-muted-foreground">
                        Disponible para venta
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
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
            {form.formState.isSubmitting ? "Creando..." : "Crear medicamento"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
