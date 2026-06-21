"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/use-auth"
import { ApiError } from "@/lib/api"

import type { LookupOption } from "../../_shared/use-empleado-lookups"
import {
  createMovimiento,
  fetchLotesDeMedicamento,
  type LoteLookupRow,
  type MovimientoCreateInput,
  type MovimientoTipoEmpleado,
} from "./use-stock-kardex"

/**
 * UI del empleado para movimientos manuales. Tipos permitidos (rbac.md):
 *  - devolucion_cliente: +cantidad (cliente devuelve mercadería)
 *  - devolucion_proveedor: −cantidad (devolver al proveedor por defecto)
 *  - vencimiento: −cantidad (baja por caducidad)
 *  - perdida: −cantidad (rotura, robo)
 *
 * `ajuste` queda fuera — solo admin (stock.adjust en rbac.md).
 */
type TipoUI = MovimientoTipoEmpleado

const TIPO_UI_LABEL: Record<TipoUI, string> = {
  devolucion_cliente: "Devolución de cliente (+)",
  devolucion_proveedor: "Devolución a proveedor (−)",
  vencimiento: "Vencimiento (−)",
  perdida: "Pérdida / rotura (−)",
}

const TIPO_SIGN: Record<TipoUI, 1 | -1> = {
  devolucion_cliente: 1,
  devolucion_proveedor: -1,
  vencimiento: -1,
  perdida: -1,
}

const schema = z.object({
  medicamento_id: z.coerce.number({ message: "Requerido" }).int().positive(),
  lote_id: z.coerce.number({ message: "Requerido" }).int().positive(),
  tipo: z.enum(["devolucion_cliente", "devolucion_proveedor", "vencimiento", "perdida"], {
    message: "Requerido",
  }),
  cantidad: z.coerce.number({ message: "Requerido" }).int().min(1, "Debe ser ≥ 1"),
  justificacion: z.string().trim().min(5, "Mínimo 5 caracteres"),
})

type FormInput = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

type Props = {
  medicamentos: LookupOption[]
  onCreated: () => void
}

export function MovimientoAltaDialog({ medicamentos, onCreated }: Props) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [lotes, setLotes] = useState<LoteLookupRow[]>([])
  const [loadingLotes, setLoadingLotes] = useState(false)

  const form = useForm<FormInput, undefined, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { justificacion: "" } as FormInput,
  })

  const watchedMedicamentoId = form.watch("medicamento_id")
  const watchedTipo = form.watch("tipo") as TipoUI | undefined

  useEffect(() => {
    const med = Number(watchedMedicamentoId)
    if (!med || Number.isNaN(med) || !user?.sucursal_id) {
      setLotes([])
      return
    }
    setLoadingLotes(true)
    fetchLotesDeMedicamento(med, user.sucursal_id)
      .then((rows) => setLotes(rows))
      .catch(() => setLotes([]))
      .finally(() => setLoadingLotes(false))
  }, [watchedMedicamentoId, user?.sucursal_id])

  useEffect(() => {
    form.setValue("lote_id", undefined as unknown as number)
  }, [watchedMedicamentoId, form])

  const onSubmit = async (values: FormOutput) => {
    if (!user) {
      toast.error("Sesión no encontrada")
      return
    }
    const payload: MovimientoCreateInput = {
      lote_id: values.lote_id,
      usuario_id: user.id,
      tipo: values.tipo,
      cantidad: values.cantidad * TIPO_SIGN[values.tipo],
      justificacion: values.justificacion,
    }
    try {
      await createMovimiento(payload)
      toast.success("Movimiento registrado")
      form.reset({ justificacion: "" } as FormInput)
      setOpen(false)
      onCreated()
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.payload as { message?: string } | undefined)?.message ?? `Error ${err.status}`)
          : err instanceof Error
            ? err.message
            : "Error al registrar movimiento"
      toast.error(msg)
    }
  }

  const cantidadHint = watchedTipo
    ? TIPO_SIGN[watchedTipo] === 1
      ? "Cantidad a sumar al lote"
      : "Cantidad a descontar del lote (se envía con signo negativo)"
    : ""

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo movimiento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Movimiento manual</DialogTitle>
          <DialogDescription>
            Registra cambios de stock que no sean venta ni recepción de lote.
            Los movimientos del Kardex son inmutables.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 py-2">
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
              name="lote_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lote</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(v) => field.onChange(Number(v))}
                    disabled={!watchedMedicamentoId || loadingLotes}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !watchedMedicamentoId
                              ? "Elige primero un medicamento"
                              : loadingLotes
                                ? "Cargando lotes..."
                                : lotes.length === 0
                                  ? "Sin lotes con stock"
                                  : "Seleccionar..."
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {lotes.map((l) => (
                        <SelectItem key={l.id} value={String(l.id)}>
                          {l.numero_lote} · stock {l.cantidad_actual} · vence{" "}
                          {l.fecha_vencimiento}
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
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.keys(TIPO_UI_LABEL) as TipoUI[]).map((t) => (
                          <SelectItem key={t} value={t}>
                            {TIPO_UI_LABEL[t]}
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
                name="cantidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        {...field}
                        value={(field.value as number | string | undefined) ?? ""}
                      />
                    </FormControl>
                    {cantidadHint && <FormDescription>{cantidadHint}</FormDescription>}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="justificacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justificación</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Motivo del movimiento (queda en el Kardex inmutable)"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Registrando..." : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
