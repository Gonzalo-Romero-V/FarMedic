import { AdminPerfilData } from "@/components/custom/admin/perfil/perfil-data"

export default function AdminPerfilPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="h2">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">
          Datos de tu cuenta como administrador. Tu alcance abarca toda la
          cadena.
        </p>
      </div>
      <AdminPerfilData />
    </div>
  )
}
