import { RequireRole } from "@/components/auth/require-role"
import { HeaderEmpleado } from "@/components/layout/header-empleado"

export default function EmpleadoLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="empleado">
      <HeaderEmpleado />
      <main className="flex flex-1 flex-col">{children}</main>
    </RequireRole>
  )
}
