"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Logo } from "@/components/layout/logo"
import { cn } from "@/lib/utils"

export type NavLink = {
  href: string
  label: string
  /** Si está presente, el link se considera activo cuando `pathname` empieza con este prefijo. */
  matchPrefix?: string
}

type Props = {
  /** Destino del logo (admin: `/admin/dashboard`, etc.). */
  logoHref: string
  /** Items principales del nav. */
  navLinks: readonly NavLink[]
  /** Cluster a la derecha (botones perfil/logout/toggle), cliente-side. */
  rightCluster: React.ReactNode
  /** Aside que se renderiza dentro del Sheet en mobile. */
  mobileAside: React.ReactNode
}

/**
 * Header común a todas las secciones privadas. Cada rol arma su propio
 * header pasando los links y los botones de la derecha.
 *
 * Reglas de UI:
 * - Nav y right-cluster se agrupan en un wrapper alineado a la derecha.
 * - Link activo: `text-primary font-semibold` + `aria-current="page"`.
 * - Hover: `transition-colors duration-200 hover:text-primary`.
 */
export function HeaderShell({ logoHref, navLinks, rightCluster, mobileAside }: Props) {
  const pathname = usePathname()
  const isActive = (link: NavLink) => {
    if (link.matchPrefix) return pathname.startsWith(link.matchPrefix)
    return pathname === link.href
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Logo href={logoHref} />

        <div className="hidden md:flex items-center ml-auto gap-10">
          <nav className="flex items-center gap-5 text-sm font-medium">
            {navLinks.map((link) => {
              const active = isActive(link)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "transition-colors duration-200 hover:text-primary",
                    active ? "text-primary font-semibold" : "text-foreground/70",
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-1">{rightCluster}</div>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir menú" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            {mobileAside}
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
