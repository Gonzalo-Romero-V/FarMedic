"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import { ApiError } from "@/lib/api"
import { type LoteRow, updateLote } from "./use-admin-lotes"

/**
 * Solo metadatos editables por contrato del modelo (Backend/app/Models/Lote.php):
 * numero_lote, fecha_vencimiento, costo_unitario. cantidad_actual y cantidad_inicial
 * son inmutables vía PUT directo — se modifican via movimientos de stock.
 */
const schema = z.object({
  numero_lote: z.string().trim().min(1, "Requerido").max(100),
  fecha_vencimiento: z.string().min(1, "Requerido"),
  costo_unitario: z.coerce
    .number({ message: "Requerido" })
    .nonnegative("Debe ser ≥ 0"),
})

type FormInput = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

type Props = {
  lote: LoteRow | null
  onClose: () => void
  onUpdated: () => void
}

export function LoteEditSheet({ lote, onClose, onUpdated }: Props) {
  const open = lote !== null

  const form = useForm<FormInput, undefined, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      numero_lote: "",
      fecha_vencimiento: "",
      costo_unitario: 0,
    } as FormInput,
  })

  useEffect(() => {
    if (lote) {
      form.reset({
        numero_lote: lote.numero_lote,
        fecha_vencimiento: lote.fecha_vencimiento,
        costo_unitario: Number(lote.costo_unitario),
      })
    }
  }, [lote, form])

  const onSubmit = async (values: FormOutput) => {
    if (!lote) return
    try {
      await updateLote(lote.id, values)
      toast.success(`Lote ${values.numero_lote} actualizado`)
      onClose()
      onUpdated()
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? (err.payload as { message?: string } | undefined)?.message ??
            `Error ${err.status}`
          : err instanceof Error
            ? err.message
            : "Error al actualizar lote"
      toast.error(msg)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Editar lote</SheetTitle>
          <SheetDescription>
            Solo se pueden modificar metadatos. La cantidad se ajusta mediante movimientos de stock.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4"
          >
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="font-medium">{lote?.medicamento?.nombre_comercial}</p>
              <p className="xs text-muted-foreground">
                Stock actual: <span className="font-semibold">{lote?.cantidad_actual}</span> ·
                Sucursal: {lote?.sucursal?.nombre} · Proveedor: {lote?.proveedor?.nombre}
              </p>
            </div>

            <FormField
              control={form.control}
              name="numero_lote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de lote</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>Fecha de vencimiento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                  <FormDescription>
                    Histórico — afecta el cálculo de valor de inventario.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <SheetFooter className="flex-row gap-2 border-t bg-muted/30 p-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={form.formState.isSubmitting}
            className="flex-1"
          >
            {form.formState.isSubmitting ? "Guardando..." : "Guardar cambios"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
