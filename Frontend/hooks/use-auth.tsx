"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface User {
  id: number
  nombre: string
  email: string
  rol: {
    id: number
    nombre: string
  }
  sucursal_id: number | null
  sucursal?: any
  telefono?: string | null
  direccion?: string | null
  google_oauth_id?: string | null
  created_at?: string | null
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (token: string, user: User) => void
  logout: () => void
  /** Reemplaza el user persistido sin tocar el token. Usado por mutaciones
   *  self-edit (ej. perfil) que devuelven el user actualizado. */
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_COOKIE = "auth_token"
const ROLE_COOKIE = "auth_role"
/** 7 días — coincide con el TTL aproximado de los tokens Sanctum por default
 *  para que la cookie no sobreviva a un token expirado. */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "path=/",
    `max-age=${maxAgeSeconds}`,
    "samesite=lax",
  ]
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    parts.push("secure")
  }
  document.cookie = parts.join("; ")
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return
  document.cookie = `${name}=; path=/; max-age=0`
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Intentar recuperar sesión de localStorage
    const storedToken = localStorage.getItem("auth_token")
    const storedUser = localStorage.getItem("auth_user")

    if (storedToken && storedUser) {
      const parsed = JSON.parse(storedUser) as User
      setToken(storedToken)
      setUser(parsed)
      // Re-hidratar cookies por si fueron purgadas (el middleware las necesita).
      setCookie(TOKEN_COOKIE, storedToken, COOKIE_MAX_AGE)
      if (parsed?.rol?.nombre) setCookie(ROLE_COOKIE, parsed.rol.nombre, COOKIE_MAX_AGE)
    }
    setIsLoading(false)
  }, [])

  const login = (newToken: string, newUser: User) => {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem("auth_token", newToken)
    localStorage.setItem("auth_user", JSON.stringify(newUser))
    setCookie(TOKEN_COOKIE, newToken, COOKIE_MAX_AGE)
    setCookie(ROLE_COOKIE, newUser?.rol?.nombre ?? "", COOKIE_MAX_AGE)

    // Evitar múltiples notificaciones seguidas (React Strict Mode dispara dos
    // veces en dev; el flujo OAuth callback → fetchUser → login también).
    const lastToast = (window as any)._last_auth_toast || 0
    if (Date.now() - lastToast > 2000) {
      toast.success(`Bienvenido, ${newUser.nombre}`)
      ;(window as any)._last_auth_toast = Date.now()
    }
  }

  const logout = async () => {
    if (token) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        })
      } catch (error) {
        console.error("Error logging out from backend:", error)
      }
    }

    setToken(null)
    setUser(null)
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_user")
    deleteCookie(TOKEN_COOKIE)
    deleteCookie(ROLE_COOKIE)
    router.push("/login")
  }

  const replaceUser = (next: User) => {
    setUser(next)
    localStorage.setItem("auth_user", JSON.stringify(next))
    if (next?.rol?.nombre) setCookie(ROLE_COOKIE, next.rol.nombre, COOKIE_MAX_AGE)
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, logout, setUser: replaceUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
