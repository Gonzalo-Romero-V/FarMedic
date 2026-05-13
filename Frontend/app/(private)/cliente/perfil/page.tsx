import { PagePlaceholder } from "@/components/custom/page-placeholder"

export default function ClientePerfilPage() {
  return (
    <PagePlaceholder
      title="Mi perfil"
      subtitle="Datos personales y de contacto."
      todos={["Nombre, email", "Teléfono y dirección (para entregas)", "Cambio de contraseña"]}
    />
  )
}
