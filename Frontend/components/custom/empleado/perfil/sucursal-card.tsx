import { MapPin } from "lucide-react"

type Sucursal = {
  id: number
  nombre: string
  ciudad?: string | null
  direccion?: string | null
  telefono?: string | null
}

type Props = { sucursal: Sucursal | null }

export function SucursalCard({ sucursal }: Props) {
  if (!sucursal) {
    return (
      <div className="rounded-md border bg-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Tu sucursal
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No tienes una sucursal asignada. Pídele a un administrador que te
          asigne una.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border bg-card p-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Tu sucursal
        </h2>
        <p className="text-base font-semibold">{sucursal.nombre}</p>
        <p className="text-xs text-muted-foreground">
          Todas tus operaciones (ventas, stock, pedidos) se registran y filtran
          por esta sucursal.
        </p>
      </div>
      <dl className="grid grid-cols-1 gap-2 text-sm">
        {sucursal.ciudad && <Row label="Ciudad" value={sucursal.ciudad} />}
        {sucursal.direccion && (
          <Row
            label="Dirección"
            value={
              <span className="inline-flex items-start gap-1">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                <span>{sucursal.direccion}</span>
              </span>
            }
          />
        )}
        {sucursal.telefono && <Row label="Teléfono" value={sucursal.telefono} />}
      </dl>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  )
}
