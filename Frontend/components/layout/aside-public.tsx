import Link from "next/link"
import { LogIn } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { DarkLightToggle } from "@/components/custom/dark-light-toggle"

export const publicNavLinks = [
  { href: "/", label: "Inicio" },
  { href: "/tutorial", label: "Tutorial" },
  { href: "/about-us", label: "Sobre nosotros" },
]

export function AsidePublic() {
  return (
    <div className="flex h-full flex-col">
      <SheetHeader>
        <SheetTitle>FarMedic</SheetTitle>
      </SheetHeader>

      <nav className="flex flex-1 flex-col gap-1 px-4 py-2">
        {publicNavLinks.map((link) => (
          <Button key={link.href} asChild variant="ghost" className="justify-start">
            <Link href={link.href}>{link.label}</Link>
          </Button>
        ))}
      </nav>

      <Separator />

      <div className="flex items-center gap-2 p-4">
        <Button asChild variant="default" size="sm" className="flex-1">
          <Link href="/login">
            <LogIn className="mr-2 h-4 w-4" />
            Iniciar sesión
          </Link>
        </Button>
        <DarkLightToggle />
      </div>
    </div>
  )
}
