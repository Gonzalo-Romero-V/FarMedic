import { AdminDashboardData } from "@/components/custom/admin/dashboard/admin-dashboard-data"
import { DashboardHeader } from "@/components/custom/admin/dashboard/dashboard-header"

export default function AdminDashboardPage() {
  return (
    <section className="container mx-auto flex flex-col gap-6 px-4 py-8">
      <DashboardHeader />
      <AdminDashboardData />
    </section>
  )
}
