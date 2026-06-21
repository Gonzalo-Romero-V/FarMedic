"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import dynamic from "next/dynamic"
import { MapPin, Plus } from "lucide-react"
import { useEffect, useState } from "react"
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
  SheetTrigger,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { ApiError } from "@/lib/api"

import {
  createSucursal,
  fetchFarmacia,
  updateSucursal,
  type SucursalRow,
} from "./use-admin-sucursales"

// Mapa con SSR off — Leaflet usa `window` y rompe en server-side.
const SucursalesMap = dynamic(
  () => import("./sucursales-map").then((m) => m.SucursalesMap),
  { ssr: false, loading: () => <Skeleton className="h-[280px] w-full rounded-md" /> },
)

const schema = z.object({
  farmacia_id: z.coerce.number().int().positive(),
  nombre: z.string().trim().min(1, "Requerido").max(255),
  ciudad: z.string().trim().min(1, "Requerido").max(100),
  direccion: z.string().trim().min(1, "Requerido").max(255),
  telefono: z.string().trim().min(1, "Requerido").max(50),
  latitud: z.coerce
    .number()
    .min(-90, "Lat ∈ [-90, 90]")
    .max(90, "Lat ∈ [-90, 90]")
    .nullable()
    .optional(),
  longitud: z.coerce
    .number()
    .min(-180, "Lng ∈ [-180, 180]")
    .max(180, "Lng ∈ [-180, 180]")
    .nullable()
    .optional(),
  activa: z.boolean(),
})

type FormInput = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

type Props = {
  /** Si presente, el sheet abre en modo edición. Si null + open desde trigger, modo alta. */
  sucursal?: SucursalRow | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSaved: () => void
  /** Renderea el trigger interno (modo alta). Para edición pasar `open` controlado. */
  triggerLabel?: string
}

export function SucursalFormSheet({
  sucursal,
  open: openProp,
  onOpenChange,
  onSaved,
  triggerLabel,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const isEdit = sucursal != null

  const [farmaciaId, setFarmaciaId] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    if (sucursal) {
      setFarmaciaId(sucursal.farmacia_id)
      return
    }
    fetchFarmacia()
      .then((f) => setFarmaciaId(f.id))
      .catch(() => setFarmaciaId(null))
  }, [open, sucursal])

  const form = useForm<FormInput, undefined, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      farmacia_id: 0,
      nombre: "",
      ciudad: "",
      direccion: "",
      telefono: "",
      latitud: null,
      longitud: null,
      activa: true,
    } as FormInput,
  })

  useEffect(() => {
    if (!open) return
    if (sucursal) {
      form.reset({
        farmacia_id: sucursal.farmacia_id,
        nombre: sucursal.nombre,
        ciudad: sucursal.ciudad,
        direccion: sucursal.direccion,
        telefono: sucursal.telefono,
        latitud: sucursal.latitud !== null ? Number(sucursal.latitud) : null,
        longitud: sucursal.longitud !== null ? Number(sucursal.longitud) : null,
        activa: sucursal.activa,
      })
    } else if (farmaciaId !== null) {
      form.reset({
        farmacia_id: farmaciaId,
        nombre: "",
        ciudad: "",
        direccion: "",
        telefono: "",
        latitud: null,
        longitud: null,
        activa: true,
      })
    }
  }, [open, sucursal, farmaciaId, form])

  const lat = form.watch("latitud")
  const lng = form.watch("longitud")
  const picked: [number, number] | null =
    lat !== null && lat !== undefined && lng !== null && lng !== undefined && !isNaN(Number(lat))
      ? [Number(lat), Number(lng)]
      : null

  const handlePick = (la: number, lo: number) => {
    form.setValue("latitud", Number(la.toFixed(7)))
    form.setValue("longitud", Number(lo.toFixed(7)))
  }

  const onSubmit = async (values: FormOutput) => {
    try {
      if (isEdit && sucursal) {
        await updateSucursal(sucursal.id, {
          nombre: values.nombre,
          ciudad: values.ciudad,
          direccion: values.direccion,
          telefono: values.telefono,
          latitud: values.latitud ?? null,
          longitud: values.longitud ?? null,
          activa: values.activa,
        })
        toast.success(`Sucursal ${values.nombre} actualizada`)
      } else {
        await createSucursal({
          farmacia_id: values.farmacia_id,
          nombre: values.nombre,
          ciudad: values.ciudad,
          direccion: values.direccion,
          telefono: values.telefono,
          latitud: values.latitud ?? null,
          longitud: values.longitud ?? null,
          activa: values.activa,
        })
        toast.success(`Sucursal ${values.nombre} creada`)
      }
      setOpen(false)
      onSaved()
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? ((err.payload as { message?: string } | undefined)?.message ?? `Error ${err.status}`)
          : err instanceof Error
            ? err.message
            : "Error al guardar"
      toast.error(msg)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {!isEdit && (
        <SheetTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {triggerLabel ?? "Nueva sucursal"}
          </Button>
        </SheetTrigger>
      )}
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar sucursal" : "Nueva sucursal"}</SheetTitle>
          <SheetDescription>
            Datos generales + coordenadas para mostrar en el mapa.
            Haz clic en el mapa para fijar lat/lng visualmente.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4"
          >
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="FarMedic Centro Riobamba" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="ciudad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad</FormLabel>
                    <FormControl>
                      <Input placeholder="Riobamba" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="032..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="direccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input placeholder="Calle, número, referencias" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium">
                  <MapPin className="inline-block h-3.5 w-3.5 mr-1" />
                  Ubicación
                </span>
                <span className="text-xs text-muted-foreground">
                  {picked
                    ? `${picked[0].toFixed(5)}, ${picked[1].toFixed(5)}`
                    : "Sin coordenadas"}
                </span>
              </div>
              <SucursalesMap sucursales={[]} onPick={handlePick} pickedPosition={picked} height={260} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="latitud"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitud</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.0000001"
                        placeholder="-1.6635"
                        {...field}
                        value={(field.value as number | null | undefined) ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? null : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitud"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitud</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.0000001"
                        placeholder="-78.6546"
                        {...field}
                        value={(field.value as number | null | undefined) ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? null : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="activa"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <FormLabel className="mb-0">Activa</FormLabel>
                    <FormDescription>
                      Cuando se desactiva no aparece en selectores de pedido/POS.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
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
            {form.formState.isSubmitting ? "Guardando..." : isEdit ? "Guardar" : "Crear"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
