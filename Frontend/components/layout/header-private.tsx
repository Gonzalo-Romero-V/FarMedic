"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, Menu, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Logo } from "@/components/layout/logo"
import { AsidePrivate, privateNavLinks } from "@/components/layout/aside-private"
import { DarkLightToggle } from "@/components/custom/dark-light-toggle"
import { cn } from "@/lib/utils"

export function HeaderPrivate() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Logo href="/dashboard" />

        {/* Desktop nav + right cluster grouped to the right */}
        <div className="hidden md:flex items-center ml-auto gap-10">
          <nav className="flex items-center gap-5 text-sm font-medium">
            {privateNavLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "transition-colors duration-200 hover:text-primary",
                    isActive ? "text-primary font-semibold" : "text-foreground/70"
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link href="/logout">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" aria-label="Mi perfil">
              <Link href="/perfil">
                <User className="h-5 w-5" />
              </Link>
            </Button>
            <DarkLightToggle />
          </div>
        </div>

        {/* Mobile hamburger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Abrir menú"
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <AsidePrivate />
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
