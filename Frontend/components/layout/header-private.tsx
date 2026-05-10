"use client"

import Link from "next/link"
import { LogOut, Menu, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Logo } from "@/components/layout/logo"
import { AsidePrivate, privateNavLinks } from "@/components/layout/aside-private"
import { DarkLightToggle } from "@/components/custom/dark-light-toggle"

export function HeaderPrivate() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Logo href="/dashboard" />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
          {privateNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-foreground/70 transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop right cluster */}
        <div className="hidden md:flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" aria-label="Mi perfil">
            <Link href="/perfil">
              <User className="h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/logout">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </Link>
          </Button>
          <DarkLightToggle />
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
