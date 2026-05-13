import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type StatCardProps = {
  label: string
  icon: LucideIcon
  /** `undefined` muestra skeleton, string renderea el valor formateado. */
  value?: string
  hint?: string
  tone?: "neutral" | "brand" | "warning" | "danger"
}

const TONE: Record<NonNullable<StatCardProps["tone"]>, string> = {
  neutral: "text-foreground",
  brand: "text-primary",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-destructive",
}

export function StatCard({ label, icon: Icon, value, hint, tone = "neutral" }: StatCardProps) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="xs uppercase tracking-wide text-muted-foreground">{label}</span>
          <Icon className={cn("h-4 w-4", TONE[tone])} aria-hidden />
        </div>
        {value === undefined ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <span className={cn("h2 font-heading tabular-nums", TONE[tone])}>{value}</span>
        )}
        {hint && <span className="xs text-muted-foreground">{hint}</span>}
      </CardContent>
    </Card>
  )
}
