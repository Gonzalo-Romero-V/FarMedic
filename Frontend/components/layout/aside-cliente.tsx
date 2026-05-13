import Link from "next/link"
import { LogOut, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AsideShell } from "@/components/layout/aside-shell"
import { DarkLightToggle } from "@/components/custom/dark-light-toggle"
import type { NavLink } from "@/components/layout/header-shell"

export const clienteNavLinks: readonly NavLink[] = [
  { href: "/cliente/dashboard", label: "Inicio" },
  { href: "/cliente/catalogo", label: "Catálogo" },
  { href: "/cliente/pedidos", label: "Mis pedidos", matchPrefix: "/cliente/pedidos" },
  { href: "/cliente/perfil", label: "Perfil" },
]

export function AsideCliente() {
  return (
    <AsideShell
      navLinks={clienteNavLinks}
      footer={
        <>
          <Button asChild variant="ghost" size="sm" className="justify-start">
            <Link href="/cliente/perfil">
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
        </>
      }
    />
  )
}
