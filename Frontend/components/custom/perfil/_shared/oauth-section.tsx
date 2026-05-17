import { Check } from "lucide-react"

import { Badge } from "@/components/ui/badge"

type Props = { hasGoogle: boolean }

/**
 * Indicador de identidades externas conectadas. V1 solo Google. Si en el
 * futuro se suman más providers, este componente se extiende sin cambiar el
 * caller (cada rol lo invoca igual).
 */
export function OAuthSection({ hasGoogle }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-md border bg-card p-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Identidades conectadas
        </h2>
        <p className="text-xs text-muted-foreground">
          Cuentas externas asociadas con tu sesión.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
          <span className="text-sm font-medium">Google</span>
          {hasGoogle ? (
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            >
              <Check className="mr-1 h-3 w-3" /> Conectada
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              No conectada
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
