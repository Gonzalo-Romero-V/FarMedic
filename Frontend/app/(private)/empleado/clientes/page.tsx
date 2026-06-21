import { ClientesData } from "@/components/custom/empleado/clientes/clientes-data"

export default function EmpleadoClientesPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="h2">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Clientes registrados. Busca por nombre o email y revisa su historial.
        </p>
      </div>
      <ClientesData />
    </div>
  )
}
