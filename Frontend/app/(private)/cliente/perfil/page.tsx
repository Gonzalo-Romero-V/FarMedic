import { ClientePerfilData } from "@/components/custom/cliente/perfil/perfil-data"

export default function ClientePerfilPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="h2">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">
          Tus datos de contacto y entrega para los pedidos.
        </p>
      </div>
      <ClientePerfilData />
    </div>
  )
}
