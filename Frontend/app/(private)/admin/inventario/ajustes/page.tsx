import { PagePlaceholder } from "@/components/custom/page-placeholder"

export default function AdminAjustesPage() {
  return (
    <PagePlaceholder
      title="Ajustes manuales"
      subtitle="Movimientos de tipo `ajuste`. Requieren justificación obligatoria y son inmutables (RF-04)."
      todos={[
        "Formulario de ajuste (lote + cantidad signed + justificación)",
        "Historial de ajustes con auditoría",
      ]}
    />
  )
}
