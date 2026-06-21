"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { useAdminLookups } from "@/components/custom/admin/_shared/use-lookups"
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
import { ApiError } from "@/lib/api"

import {
  createUsuario,
  fetchRoles,
  updateUsuario,
  type Rol,
  type UsuarioRow,
} from "./use-admin-usuarios"

const altaSchema = z.object({
  nombre: z.string().trim().min(1, "Requerido").max(255),
  email: z.string().email("Email inválido").max(255),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  rol_id: z.coerce.number().int().positive(),
  sucursal_id: z.coerce.number().int().positive().nullable().optional(),
  telefono: z.string().trim().max(50).optional().or(z.literal("")),
  direccion: z.string().trim().max(255).optional().or(z.literal("")),
})

const editSchema = z.object({
  nombre: z.string().trim().min(1, "Requerido").max(255),
  email: z.string().email("Email inválido").max(255),
  password: z.string().optional().or(z.literal("")),
  sucursal_id: z.coerce.number().int().positive().nullable().optional(),
  telefono: z.string().trim().max(50).optional().or(z.literal("")),
  direccion: z.string().trim().max(255).optional().or(z.literal("")),
})

type AltaInput = z.input<typeof altaSchema>
type AltaOutput = z.output<typeof altaSchema>
type EditInput = z.input<typeof editSchema>
type EditOutput = z.output<typeof editSchema>

type Props = {
  usuario?: UsuarioRow | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSaved: () => void
}

export function UsuarioFormSheet({ usuario, open: openProp, onOpenChange, onSaved }: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const isEdit = usuario != null

  const [roles, setRoles] = useState<Rol[]>([])
  const lookups = useAdminLookups()
  const sucursales = lookups.status === "ready" ? lookups.sucursales : []

  useEffect(() => {
    if (!open) return
    fetchRoles()
      .then(setRoles)
      .catch(() => setRoles([]))
  }, [open])

  const altaForm = useForm<AltaInput, undefined, AltaOutput>({
    resolver: zodResolver(altaSchema),
    defaultValues: {
      nombre: "",
      email: "",
      password: "",
      rol_id: 0,
      sucursal_id: null,
      telefono: "",
      direccion: "",
    } as AltaInput,
  })

  const editForm = useForm<EditInput, undefined, EditOutput>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      nombre: "",
      email: "",
      password: "",
      sucursal_id: null,
      telefono: "",
      direccion: "",
    } as EditInput,
  })

  useEffect(() => {
    if (!open) return
    if (usuario) {
      editForm.reset({
        nombre: usuario.nombre,
        email: usuario.email,
        password: "",
        sucursal_id: usuario.sucursal_id,
        telefono: usuario.telefono ?? "",
        direccion: usuario.direccion ?? "",
      })
    } else {
      altaForm.reset({
        nombre: "",
        email: "",
        password: "",
        rol_id: 0,
        sucursal_id: null,
        telefono: "",
        direccion: "",
      } as AltaInput)
    }
  }, [open, usuario, altaForm, editForm])

  const rolNuevoId = altaForm.watch("rol_id")
  const rolNuevo = roles.find((r) => r.id === Number(rolNuevoId))
  const altaRequiereSucursal =
    rolNuevo && (rolNuevo.nombre === "administrador" || rolNuevo.nombre === "empleado")

  const onSubmitAlta = async (values: AltaOutput) => {
    try {
      await createUsuario({
        rol_id: values.rol_id,
        sucursal_id: values.sucursal_id ?? null,
        nombre: values.nombre,
        email: values.email,
        password: values.password,
        telefono: values.telefono || null,
        direccion: values.direccion || null,
      })
      toast.success(`Usuario ${values.nombre} creado`)
      setOpen(false)
      onSaved()
    } catch (err) {
      handleError(err)
    }
  }

  const onSubmitEdit = async (values: EditOutput) => {
    if (!usuario) return
    try {
      const payload: Parameters<typeof updateUsuario>[1] = {
        nombre: values.nombre,
        email: values.email,
        sucursal_id: values.sucursal_id ?? null,
        telefono: values.telefono || null,
        direccion: values.direccion || null,
      }
      if (values.password) payload.password = values.password
      await updateUsuario(usuario.id, payload)
      toast.success(`Usuario ${values.nombre} actualizado`)
      setOpen(false)
      onSaved()
    } catch (err) {
      handleError(err)
    }
  }

  const handleError = (err: unknown) => {
    const msg =
      err instanceof ApiError
        ? ((err.payload as { message?: string } | undefined)?.message ?? `Error ${err.status}`)
        : err instanceof Error
          ? err.message
          : "Error al guardar"
    toast.error(msg)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {!isEdit && (
        <SheetTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo usuario
          </Button>
        </SheetTrigger>
      )}
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar usuario" : "Nuevo usuario"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Modifica datos generales. Para cambiar el rol usa el ícono de escudo en la tabla."
              : "El rol determina si requiere sucursal asignada."}
          </SheetDescription>
        </SheetHeader>

        {isEdit ? (
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onSubmitEdit)}
              className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4"
            >
              <FormField
                control={editForm.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva contraseña (opcional)</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Dejar vacío para no cambiar" {...field} />
                    </FormControl>
                    <FormDescription>Mín. 8 caracteres si se modifica.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {usuario?.rol?.nombre !== "cliente" && (
                <FormField
                  control={editForm.control}
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
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={editForm.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="direccion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        ) : (
          <Form {...altaForm}>
            <form
              onSubmit={altaForm.handleSubmit(onSubmitAlta)}
              className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4"
            >
              <FormField
                control={altaForm.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={altaForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={altaForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={altaForm.control}
                name="rol_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
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
                        {roles.map((r) => (
                          <SelectItem key={r.id} value={String(r.id)}>
                            {r.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {altaRequiereSucursal && (
                <FormField
                  control={altaForm.control}
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
                      <FormDescription>
                        Obligatoria para administradores y empleados.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={altaForm.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={altaForm.control}
                  name="direccion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        )}

        <SheetFooter className="flex-row gap-2 border-t bg-muted/30 p-4">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={
              isEdit
                ? editForm.handleSubmit(onSubmitEdit)
                : altaForm.handleSubmit(onSubmitAlta)
            }
            disabled={isEdit ? editForm.formState.isSubmitting : altaForm.formState.isSubmitting}
            className="flex-1"
          >
            {isEdit ? "Guardar" : "Crear"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
