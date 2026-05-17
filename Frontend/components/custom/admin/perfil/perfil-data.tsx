"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"

import { IdentitySection } from "@/components/custom/perfil/_shared/identity-section"
import { OAuthSection } from "@/components/custom/perfil/_shared/oauth-section"
import { PasswordSection } from "@/components/custom/perfil/_shared/password-section"
import { useSelfProfile } from "@/components/custom/perfil/_shared/use-self-profile"

import { AdminAccountCard } from "./account-card"

export function AdminPerfilData() {
  const { user, updateProfile, updatePassword, savingProfile, savingPassword } =
    useSelfProfile()

  if (!user) {
    return (
      <Alert>
        <AlertDescription>Cargando perfil…</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <IdentitySection
          email={user.email}
          initial={{ nombre: user.nombre, telefono: user.telefono ?? "" }}
          loading={savingProfile}
          onSubmit={(values) =>
            updateProfile({ nombre: values.nombre, telefono: values.telefono || null })
          }
        />
        <PasswordSection loading={savingPassword} onSubmit={updatePassword} />
      </div>
      <div className="flex flex-col gap-4">
        <AdminAccountCard
          nombre={user.nombre}
          email={user.email}
          sucursalNombre={user.sucursal?.nombre ?? null}
          miembroDesde={user.created_at ?? null}
        />
        <OAuthSection hasGoogle={!!user.google_oauth_id} />
      </div>
    </div>
  )
}
