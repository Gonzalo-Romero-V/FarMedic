"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { NavLink } from "@/components/layout/header-shell"

type Props = {
  navLinks: readonly NavLink[]
  /** Footer del aside (perfil, logout, theme toggle, etc.). */
  footer: React.ReactNode
}

export function AsideShell({ navLinks, footer }: Props) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      <SheetHeader>
        <SheetTitle>FarMedic</SheetTitle>
      </SheetHeader>

      <nav className="flex flex-1 flex-col gap-1 px-4 py-2">
        {navLinks.map((link) => {
          const active = link.matchPrefix
            ? pathname.startsWith(link.matchPrefix)
            : pathname === link.href
          return (
            <Button
              key={link.href}
              asChild
              variant="ghost"
              className={cn("justify-start", active && "text-primary font-semibold")}
            >
              <Link href={link.href} aria-current={active ? "page" : undefined}>
                {link.label}
              </Link>
            </Button>
          )
        })}
      </nav>

      <Separator />

      <div className="flex flex-col gap-2 p-4">{footer}</div>
    </div>
  )
}
