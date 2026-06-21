import { Info } from "lucide-react"

export function EntregaTipCard() {
  return (
    <div className="flex items-start gap-3 rounded-md border bg-muted/40 p-4 text-sm">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="space-y-1">
        <p className="font-medium">¿Cómo se usan tu teléfono y dirección?</p>
        <p className="text-xs text-muted-foreground">
          Se cargan automáticamente al confirmar un pedido a domicilio para
          ahorrarte digitar, pero puedes sobrescribirlos en cada checkout. Los
          datos solo se comparten con la sucursal que prepara tu pedido.
        </p>
      </div>
    </div>
  )
}
