import { UsuariosData } from "@/components/custom/admin/usuarios/usuarios-data"

export default function AdminUsuariosPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="h2">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Administradores, empleados y clientes. El ícono de escudo abre el diálogo para cambiar rol.
        </p>
      </div>
      <UsuariosData />
    </div>
  )
}
