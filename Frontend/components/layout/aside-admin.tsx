import Link from "next/link"
import { LogOut, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AsideShell } from "@/components/layout/aside-shell"
import { DarkLightToggle } from "@/components/custom/dark-light-toggle"
import type { NavLink } from "@/components/layout/header-shell"

export const adminNavLinks: readonly NavLink[] = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/sucursales", label: "Sucursales" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/catalogo", label: "Catálogo" },
  { href: "/admin/inventario", label: "Inventario", matchPrefix: "/admin/inventario" },
  { href: "/admin/reportes", label: "Reportes" },
  { href: "/admin/auditoria", label: "Auditoría" },
]

export function AsideAdmin() {
  return (
    <AsideShell
      navLinks={adminNavLinks}
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
