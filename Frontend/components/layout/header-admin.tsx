"use client"

import Link from "next/link"
import { LogOut, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { HeaderShell } from "@/components/layout/header-shell"
import { AsideAdmin, adminNavLinks } from "@/components/layout/aside-admin"
import { DarkLightToggle } from "@/components/custom/dark-light-toggle"

export function HeaderAdmin() {
  return (
    <HeaderShell
      logoHref="/admin/dashboard"
      navLinks={adminNavLinks}
      rightCluster={
        <>
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
        </>
      }
      mobileAside={<AsideAdmin />}
    />
  )
}
