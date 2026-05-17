import { ReportesData } from "@/components/custom/admin/reportes/reportes-data"

export default function AdminReportesPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="h2">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Generá un PDF mensual totalizado y por sucursal: ventas, stock crítico al cierre y resumen de Kardex.
        </p>
      </div>
      <ReportesData />
    </div>
  )
}
