import { EmpleadoPerfilData } from "@/components/custom/empleado/perfil/perfil-data"

export default function EmpleadoPerfilPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="h2">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">
          Datos de tu cuenta y sucursal asignada.
        </p>
      </div>
      <EmpleadoPerfilData />
    </div>
  )
}
