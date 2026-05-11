import Link from "next/link"
import { LogOut, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { DarkLightToggle } from "@/components/custom/dark-light-toggle"

export const privateNavLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/kardex", label: "Kardex" },
  { href: "/pos", label: "Punto de Venta" },
  { href: "/ayuda", label: "Ayuda" },
]

export function AsidePrivate() {
  return (
    <div className="flex h-full flex-col">
      <SheetHeader>
        <SheetTitle>FarMedic</SheetTitle>
      </SheetHeader>

      <nav className="flex flex-1 flex-col gap-1 px-4 py-2">
        {privateNavLinks.map((link) => (
          <Button key={link.href} asChild variant="ghost" className="justify-start">
            <Link href={link.href}>{link.label}</Link>
          </Button>
        ))}
      </nav>

      <Separator />

      <div className="flex flex-col gap-2 p-4">
        <Button asChild variant="ghost" size="sm" className="justify-start">
          <Link href="/perfil">
            <User className="mr-2 h-4 w-4" />
            Mi perfil
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href="/logout">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </Link>
          </Button>
          <DarkLightToggle />
        </div>
      </div>
    </div>
  )
}
