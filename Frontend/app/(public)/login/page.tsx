"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, Globe } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"

type AuthMode = "login" | "register"

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, token, isLoading: isAuthLoading } = useAuth()
  
  // Estado para alternar entre login y registro
  const [mode, setMode] = useState<AuthMode>("login")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Campos del formulario
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    telefono: "",
    direccion: "",
  })

  useEffect(() => {
    // Sincronizar modo con URL si se desea (?mode=register)
    const m = searchParams.get("mode") as AuthMode
    if (m === "register" || m === "login") {
      setMode(m)
    }
  }, [searchParams])

  useEffect(() => {
    if (!isAuthLoading && token) {
      router.push("/dashboard")
    }
  }, [token, isAuthLoading, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register/cliente"
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        // Manejo de errores de validación de Laravel
        if (data.errors) {
          const firstError = Object.values(data.errors)[0] as string[]
          throw new Error(firstError[0])
        }
        throw new Error(data.message || "Error en la operación")
      }

      login(data.token, data.user)
      toast.success(mode === "login" ? `Bienvenido, ${data.user.nombre}` : "Cuenta creada con éxito")
      router.push("/dashboard")
    } catch (error: any) {
      toast.error(error.message || "Ocurrió un error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google/redirect`
  }

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login")
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col md:flex-row overflow-hidden bg-background">
      {/* Columna Izquierda: Banner Placeholder */}
      <div className="relative hidden w-full md:flex md:w-1/2 lg:w-3/5 items-center justify-center bg-background border-r">
        <span className="text-muted-foreground font-medium uppercase tracking-widest opacity-20 text-4xl">
          Banner
        </span>
      </div>

      {/* Columna Derecha: Formulario (Desplazado a la izquierda) */}
      <div className="flex w-full items-center justify-start p-8 md:w-1/2 lg:w-2/5 md:pl-16 lg:pl-24">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-left">
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {mode === "login" 
                ? "Ingresa tus credenciales para acceder" 
                : "Regístrate como cliente para realizar pedidos online"}
            </p>
          </div>

          <div className="grid gap-6">
            <form onSubmit={handleSubmit} className="grid gap-4">
              {mode === "register" && (
                <div className="grid gap-2">
                  <Label htmlFor="nombre">Nombre completo</Label>
                  <Input
                    id="nombre"
                    placeholder="Juan Pérez"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className="bg-transparent"
                  />
                </div>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nombre@ejemplo.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  autoComplete="email"
                  className="bg-transparent"
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  {mode === "login" && (
                    <Link
                      href="/recuperar-password"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="bg-transparent"
                />
              </div>

              {mode === "register" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="telefono">Teléfono (opcional)</Label>
                    <Input
                      id="telefono"
                      placeholder="0999999999"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className="bg-transparent"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="direccion">Dirección (opcional)</Label>
                    <Input
                      id="direccion"
                      placeholder="Av. Principal y Calle Secundaria"
                      value={formData.direccion}
                      onChange={handleInputChange}
                      className="bg-transparent"
                    />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "login" ? "Ingresar" : "Registrarse"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  O continúa con
                </span>
              </div>
            </div>

            <Button variant="outline" type="button" className="w-full h-11" onClick={handleGoogleLogin}>
              <Globe className="mr-2 h-4 w-4" />
              Google
            </Button>
          </div>

          <p className="text-left text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                ¿No tienes una cuenta?{" "}
                <button 
                  onClick={toggleMode}
                  className="font-medium text-primary hover:underline"
                >
                  Regístrate como cliente
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes una cuenta?{" "}
                <button 
                  onClick={toggleMode}
                  className="font-medium text-primary hover:underline"
                >
                  Inicia sesión
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
