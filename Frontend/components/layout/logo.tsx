import Link from "next/link"
import { Pill } from "lucide-react"

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2" aria-label="FarMedic — Inicio">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand">
        <Pill className="h-5 w-5 text-brand-foreground" />
      </span>
      <span className="text-lg font-bold tracking-tight text-foreground">FarMedic</span>
    </Link>
  )
}
