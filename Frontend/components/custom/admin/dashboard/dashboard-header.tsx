const FECHA_FMT = new Intl.DateTimeFormat("es-EC", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "America/Guayaquil",
})

type Props = {
  title?: string
  subtitle?: string
}

export function DashboardHeader({
  title = "Dashboard global",
  subtitle = "Métricas agregadas de todas las sucursales",
}: Props) {
  const hoy = FECHA_FMT.format(new Date())
  return (
    <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="h1 text-foreground">{title}</h1>
        <p className="body text-muted-foreground">{subtitle}</p>
      </div>
      <p className="small capitalize text-muted-foreground">{hoy}</p>
    </header>
  )
}
