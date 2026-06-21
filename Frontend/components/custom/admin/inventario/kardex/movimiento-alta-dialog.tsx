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

import type { LookupOption } from "../../_shared/use-lookups"
import {
  createMovimiento,
  fetchLotesDeMedicamento,
  type LoteLookupRow,
  type MovimientoCreateInput,
} from "./use-admin-kardex"

/**
 * Mapping UI → backend (decisión temporal C1 — [[frontend-modules]] sección
 * Módulo: admin / inventario). En la UI exponemos 4 labels pensados en el lenguaje
 * operativo del admin; al backend se envía el `tipo` canónico con el signo correcto.
 *
 * - "Entrada" (suma stock al lote existente): backend `ajuste` con signo +.
 *   Para crear stock desde un proveedor nuevo, el flujo correcto es "Nuevo lote"
 *   (en /admin/inventario/lotes), que auto-genera el movimiento `ingreso`.
 * - "Salida" (pérdida/rotura/contaminación): backend `perdida` con signo −.
 * - "Ajuste" (corrección signed): backend `ajuste` con el signo que el usuario indica.
 * - "Vencimiento" (baja por caducidad): backend `vencimiento` con signo −.
 */
type TipoUI = "entrada" | "salida" | "ajuste" | "vencimiento"

const TIPO_UI_LABEL: Record<TipoUI, string> = {
  entrada: "Entrada (sumar stock)",
  salida: "Salida (pérdida)",
  ajuste: "Ajuste (signed)",
  vencimiento: "Vencimiento",
}

const schema = z
  .object({
    medicamento_id: z.coerce.number({ message: "Requerido" }).int().positive(),
    lote_id: z.coerce.number({ message: "Requerido" }).int().positive(),
    tipo_ui: z.enum(["entrada", "salida", "ajuste", "vencimiento"], {
      message: "Requerido",
    }),
    cantidad: z.coerce
      .number({ message: "Requerido" })
      .int()
      .refine((v) => v !== 0, "No puede ser 0"),
    justificacion: z.string().trim().min(5, "Mínimo 5 caracteres"),
  })
  .refine(
    (d) => (d.tipo_ui === "ajuste" ? true : d.cantidad > 0),
    { path: ["cantidad"], message: "Para este tipo la cantidad debe ser positiva" },
  )

type FormInput = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

function toBackendPayload(values: FormOutput, usuarioId: number): MovimientoCreateInput {
  const mapping: Record<TipoUI, { tipo: MovimientoCreateInput["tipo"]; sign: 1 | -1 }> = {
    entrada: { tipo: "ajuste", sign: 1 },
    salida: { tipo: "perdida", sign: -1 },
    ajuste: { tipo: "ajuste", sign: 1 }, // la cantidad ya viene con su signo
    vencimiento: { tipo: "vencimiento", sign: -1 },
  }
  const { tipo, sign } = mapping[values.tipo_ui]
  return {
    lote_id: values.lote_id,
    usuario_id: usuarioId,
    tipo,
    cantidad: values.cantidad * sign,
    justificacion: values.justificacion,
  }
}

type Props = {
  medicamentos: LookupOption[]
  onCreated: () => void
}

export function MovimientoAltaDialog({ medicamentos, onCreated }: Props) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [lotesDelMedicamento, setLotesDelMedicamento] = useState<LoteLookupRow[]>([])
  const [loadingLotes, setLoadingLotes] = useState(false)

  const form = useForm<FormInput, undefined, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      justificacion: "",
    } as FormInput,
  })

  const watchedMedicamentoId = form.watch("medicamento_id")
  const watchedTipo = form.watch("tipo_ui") as TipoUI | undefined

  // Cargar lotes cuando cambia el medicamento
  useEffect(() => {
    const med = Number(watchedMedicamentoId)
    if (!med || Number.isNaN(med)) {
      setLotesDelMedicamento([])
      return
    }
    const ctrl = new AbortController()
    setLoadingLotes(true)
    fetchLotesDeMedicamento(med)
      .then((rows) => setLotesDelMedicamento(rows))
      .catch(() => setLotesDelMedicamento([]))
      .finally(() => setLoadingLotes(false))
    return () => ctrl.abort()
  }, [watchedMedicamentoId])

  // Resetear lote seleccionado si cambia el medicamento
  useEffect(() => {
    form.setValue("lote_id", undefined as unknown as number)
  }, [watchedMedicamentoId, form])

  const onSubmit = async (values: FormOutput) => {
    if (!user) {
      toast.error("Sesión no encontrada")
      return
    }
    try {
      await createMovimiento(toBackendPayload(values, user.id))
      toast.success("Movimiento registrado")
      form.reset({ justificacion: "" } as FormInput)
      setOpen(false)
      onCreated()
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? (err.payload as { message?: string } | undefined)?.message ??
            `Error ${err.status}`
          : err instanceof Error
            ? err.message
            : "Error al registrar movimiento"
      toast.error(msg)
    }
  }

  const cantidadHint =
    watchedTipo === "ajuste"
      ? "Signed: usa números negativos para reducir stock"
      : watchedTipo === "entrada"
        ? "Cantidad a sumar al stock del lote"
        : watchedTipo === "salida"
          ? "Cantidad a descontar (se envía con signo negativo)"
          : watchedTipo === "vencimiento"
            ? "Cantidad a dar de baja del lote"
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
          <DialogTitle>Nuevo movimiento manual</DialogTitle>
          <DialogDescription>
            Registra un cambio de stock que NO sea venta automática ni recepción de lote nuevo.
            Los movimientos del kardex son inmutables.
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
                                : lotesDelMedicamento.length === 0
                                  ? "Sin lotes con stock"
                                  : "Seleccionar..."
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {lotesDelMedicamento.map((l) => (
                        <SelectItem key={l.id} value={String(l.id)}>
                          {l.numero_lote} · stock {l.cantidad_actual} · vence {l.fecha_vencimiento}
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
                name="tipo_ui"
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
          <Button onClick={form.handleSubmit(onSubmit)} disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Registrando..." : "Registrar movimiento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
