import { RequireRole } from "@/components/auth/require-role"
import { HeaderCliente } from "@/components/layout/header-cliente"

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="cliente">
      <HeaderCliente />
      <main className="flex flex-1 flex-col">{children}</main>
    </RequireRole>
  )
}
