import { SucursalesData } from "@/components/custom/admin/sucursales/sucursales-data"

export default function AdminSucursalesPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="h2">Sucursales</h1>
        <p className="text-sm text-muted-foreground">
          Gestión de sucursales con ubicación geográfica. Click en el mapa al editar para fijar coordenadas.
        </p>
      </div>
      <SucursalesData />
    </div>
  )
}
