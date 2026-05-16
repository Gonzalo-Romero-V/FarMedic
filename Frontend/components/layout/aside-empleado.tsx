import Link from "next/link"
import { LogOut, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AsideShell } from "@/components/layout/aside-shell"
import { DarkLightToggle } from "@/components/custom/dark-light-toggle"
import type { NavLink } from "@/components/layout/header-shell"

export const empleadoNavLinks: readonly NavLink[] = [
  { href: "/empleado/dashboard", label: "Dashboard" },
  { href: "/empleado/pos", label: "Punto de venta" },
  { href: "/empleado/ventas", label: "Ventas" },
  { href: "/empleado/stock", label: "Stock", matchPrefix: "/empleado/stock" },
  { href: "/empleado/clientes", label: "Clientes" },
]

export function AsideEmpleado() {
  return (
    <AsideShell
      navLinks={empleadoNavLinks}
      footer={
        <>
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
        </>
      }
    />
  )
}
