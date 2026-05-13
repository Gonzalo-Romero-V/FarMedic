import { NextResponse, type NextRequest } from "next/server"

import { isRole } from "@/lib/permissions"
import { homeForRole, roleFromPathname } from "@/lib/permissions/role-routes"

const TOKEN_COOKIE = "auth_token"
const ROLE_COOKIE = "auth_role"

/**
 * Edge-level role guard. Es la primera línea de defensa para la UI:
 * decide antes de que Next.js renderice la página.
 *
 * Reglas:
 * 1. `/admin/*`, `/empleado/*`, `/cliente/*` requieren cookie `auth_token`.
 * 2. El prefijo de la URL debe coincidir con el rol que vive en `auth_role`.
 *    Si no coincide, redirige a la home propia del rol.
 * 3. Si un usuario autenticado visita `/login`, lo manda a su home.
 *
 * Importante: estas cookies son seteadas por el cliente en `use-auth.tsx`.
 * No son seguridad — la autoridad real es el backend, que valida el Bearer
 * token en cada request. Este middleware solo evita pantallazos
 * inconsistentes de UI.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(TOKEN_COOKIE)?.value
  const rawRole = request.cookies.get(ROLE_COOKIE)?.value
  const role = isRole(rawRole) ? rawRole : null

  // ¿Está en una zona privada con prefijo de rol?
  const requestedRole = roleFromPathname(pathname)

  if (requestedRole) {
    if (!token) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("next", pathname)
      return NextResponse.redirect(url)
    }
    if (role && role !== requestedRole) {
      const url = request.nextUrl.clone()
      url.pathname = homeForRole(role)
      url.search = ""
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // Login con sesión activa → redirigir a la home del rol.
  if (pathname === "/login" && token && role) {
    const url = request.nextUrl.clone()
    url.pathname = homeForRole(role)
    url.search = ""
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// NOTA: `matcher` debe ser estático (literal); Next.js lo parsea en build.
// Si cambian los prefijos en `role-routes.ts`, actualizar también acá.
export const config = {
  matcher: ["/admin/:path*", "/empleado/:path*", "/cliente/:path*", "/login"],
}
