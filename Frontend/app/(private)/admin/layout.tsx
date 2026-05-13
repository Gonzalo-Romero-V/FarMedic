import { RequireRole } from "@/components/auth/require-role"
import { HeaderAdmin } from "@/components/layout/header-admin"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="administrador">
      <HeaderAdmin />
      <main className="flex flex-1 flex-col">{children}</main>
    </RequireRole>
  )
}
