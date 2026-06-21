import { HeartPulse, PackageSearch, ShoppingCart, BarChart3, GraduationCap, Zap } from "lucide-react"

export default function AboutUsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16 space-y-20">

      {/* Hero */}
      <div className="text-center space-y-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
          <HeartPulse className="h-4 w-4" />
          Sistema farmacéutico integral
        </span>
        <h1 className="h1 text-foreground">¿Qué es FarMedic?</h1>
        <p className="body text-muted-foreground max-w-2xl mx-auto">
          FarMedic es un sistema web que unifica la gestión de inventario, el punto de venta
          en mostrador y el canal de pedidos online de una farmacia — todo desde una sola interfaz.
        </p>
      </div>

      {/* Problema y solución */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-7 space-y-3">
          <h2 className="h3 text-foreground">El problema</h2>
          <p className="body text-muted-foreground">
            Las farmacias gestionan stock, ventas y pedidos online en sistemas separados o incluso
            en papel. Esto genera errores de inventario, pérdidas por caducidad no detectada
            y un canal digital limitado al local físico.
          </p>
        </div>
        <div className="rounded-lg border bg-accent/40 p-7 space-y-3">
          <h2 className="h3 text-foreground">La solución</h2>
          <p className="body text-muted-foreground">
            Una plataforma integrada con trazabilidad total por lote, alertas automáticas de
            caducidad, POS ágil para el mostrador y catálogo online para que los clientes
            hagan pedidos desde cualquier lugar.
          </p>
        </div>
      </div>

      {/* Valores clave */}
      <div className="space-y-6">
        <h2 className="h2 text-foreground text-center">Lo que FarMedic ofrece</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: <PackageSearch className="h-5 w-5" />,
              title: "Trazabilidad total",
              body: "Control de lotes, fechas de caducidad y movimientos de stock por sucursal.",
            },
            {
              icon: <Zap className="h-5 w-5" />,
              title: "POS en tiempo real",
              body: "Punto de venta ágil con búsqueda por principio activo y comprobante PDF.",
            },
            {
              icon: <ShoppingCart className="h-5 w-5" />,
              title: "Pedidos online",
              body: "Catálogo público para que los clientes exploren y ordenen sin moverse de casa.",
            },
            {
              icon: <BarChart3 className="h-5 w-5" />,
              title: "Reportes estratégicos",
              body: "Ventas, top productos y kardex accesibles para el administrador.",
            },
            {
              icon: <HeartPulse className="h-5 w-5" />,
              title: "Multi-sucursal",
              body: "Una farmacia, varios locales. El stock y los usuarios se gestionan por sucursal.",
            },
            {
              icon: <GraduationCap className="h-5 w-5" />,
              title: "Contexto académico",
              body: "Proyecto de Ingeniería de Software — ESPOCH, carrera de Software, 2026.",
            },
          ].map(({ icon, title, body }) => (
            <div key={title} className="rounded-lg border bg-card p-5 space-y-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
                {icon}
              </span>
              <h3 className="h4 text-foreground">{title}</h3>
              <p className="small text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Roles */}
      <div className="rounded-lg border bg-card p-8 space-y-6">
        <h2 className="h2 text-foreground text-center">¿Para quién es FarMedic?</h2>
        <div className="divide-y">
          {[
            { role: "Administrador", desc: "Gestiona usuarios, sucursales, precios, inventario completo y reportes estratégicos." },
            { role: "Empleado", desc: "Opera el POS, gestiona pedidos entrantes y controla el stock de su sucursal." },
            { role: "Cliente", desc: "Explora el catálogo público, realiza pedidos online y hace seguimiento desde su cuenta." },
          ].map(({ role, desc }) => (
            <div key={role} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              <span className="mt-0.5 inline-flex h-6 min-w-[6rem] items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-semibold">
                {role}
              </span>
              <p className="small text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
