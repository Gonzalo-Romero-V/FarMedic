"use client"

import { Check, FileText, Upload } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { crearReceta, type RecetaResponse } from "@/components/custom/empleado/pos/use-pos"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/lib/api"

/**
 * Bloque de receta para el checkout del cliente. Mismo contrato que el POS empleado:
 * `crearReceta()` POST multipart a /api/recetas. Reutilizo la función del módulo POS
 * para no duplicar el shape del payload/response.
 */

type Props = {
  recetaId: number | null
  onRecetaCreada: (receta: RecetaResponse) => void
  onLimpiar: () => void
}

export function RecetaBlock({ recetaId, onRecetaCreada, onLimpiar }: Props) {
  const [numero, setNumero] = useState("")
  const [doctor, setDoctor] = useState("")
  const [fechaEmision, setFechaEmision] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [imagen, setImagen] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const adjuntada = recetaId !== null

  const handleSubmit = async () => {
    if (!numero.trim() && !imagen) {
      toast.error("Cargá un número de receta o subí la imagen")
      return
    }
    setSubmitting(true)
    try {
      const receta = await crearReceta({
        numero: numero.trim() || undefined,
        doctor: doctor.trim() || undefined,
        fecha_emision: fechaEmision || undefined,
        observaciones: observaciones.trim() || undefined,
        imagen: imagen ?? undefined,
      })
      toast.success("Receta adjuntada")
      onRecetaCreada(receta)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? (err.payload as { message?: string } | undefined)?.message ?? `Error ${err.status}`
          : err instanceof Error
            ? err.message
            : "Error al guardar receta"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30">
      <div className="flex items-start gap-3 border-b border-amber-200 p-3 dark:border-amber-900/50">
        <FileText className="mt-0.5 h-4 w-4 text-amber-700 dark:text-amber-300" />
        <div className="flex-1 text-sm">
          <div className="font-medium text-amber-900 dark:text-amber-100">
            Receta requerida
          </div>
          <div className="text-xs text-amber-800/80 dark:text-amber-200/80">
            Tu carrito contiene productos con receta obligatoria. Adjuntá número o imagen.
          </div>
        </div>
      </div>

      {adjuntada ? (
        <Alert className="m-3 border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <Check className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-emerald-900 dark:text-emerald-100">
              Receta #{recetaId} adjuntada.
            </span>
            <Button variant="ghost" size="sm" onClick={onLimpiar}>
              Cambiar
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="flex flex-col gap-3 p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rec-num">Número</Label>
              <Input
                id="rec-num"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Ej. R-2026-00123"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rec-doc">Médico</Label>
              <Input
                id="rec-doc"
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
                placeholder="Nombre"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rec-fecha">Fecha emisión</Label>
              <Input
                id="rec-fecha"
                type="date"
                value={fechaEmision}
                onChange={(e) => setFechaEmision(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rec-img">Imagen (opcional)</Label>
              <Input
                id="rec-img"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setImagen(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rec-obs">Observaciones</Label>
            <Textarea
              id="rec-obs"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              placeholder="Notas opcionales"
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSubmit} disabled={submitting}>
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              {submitting ? "Adjuntando..." : "Adjuntar receta"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
