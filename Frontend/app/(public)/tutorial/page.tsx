import { ShoppingCart, Search, ClipboardList, ScanBarcode, FileText, BarChart3, Users, Layers, Package, LogIn, UserPlus, Bell } from "lucide-react"

const ROLES = [
  {
    label: "Cliente",
    color: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    steps: [
      { icon: <Search className="h-4 w-4" />, title: "Explorá el catálogo", desc: "Ingresá a /catalogo sin necesidad de cuenta. Filtrá por categoría o buscá por nombre del medicamento." },
      { icon: <UserPlus className="h-4 w-4" />, title: "Creá tu cuenta", desc: "Registrate con tu email o con Google. En segundos tenés acceso a tu panel de pedidos." },
      { icon: <ShoppingCart className="h-4 w-4" />, title: "Hacé un pedido", desc: "Elegí los medicamentos, confirmá las cantidades y enviá el pedido. Recibirás un número de seguimiento." },
      { icon: <ClipboardList className="h-4 w-4" />, title: "Seguí tu pedido", desc: "En Mi cuenta → Pedidos podés ver el estado actualizado: pendiente, en camino o entregado." },
    ],
  },
  {
    label: "Empleado",
    color: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    steps: [
      { icon: <LogIn className="h-4 w-4" />, title: "Accedé con tu cuenta", desc: "El administrador crea tu usuario. Iniciá sesión y serás redirigido a tu panel de empleado." },
      { icon: <ScanBarcode className="h-4 w-4" />, title: "Usá el POS", desc: "En Punto de Venta buscá el medicamento por nombre o código de barras, ajustá cantidades y procesá el cobro." },
      { icon: <FileText className="h-4 w-4" />, title: "Emitir comprobante", desc: "Al completar la venta, el sistema genera un comprobante PDF descargable para el cliente." },
      { icon: <Bell className="h-4 w-4" />, title: "Gestioná pedidos online", desc: "En la sección Pedidos atendé los pedidos entrantes del canal online y actualizá su estado." },
    ],
  },
  {
    label: "Administrador",
    color: "bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-900",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
    steps: [
      { icon: <Layers className="h-4 w-4" />, title: "Configurá tu farmacia", desc: "En Configuración cargá el nombre, RUC, logo y tasa de IVA de tu farmacia." },
      { icon: <Package className="h-4 w-4" />, title: "Gestioná el inventario", desc: "Ingresá medicamentos, registrá lotes con fechas de vencimiento y recibí alertas automáticas de caducidad." },
      { icon: <Users className="h-4 w-4" />, title: "Administrá usuarios", desc: "Creá cuentas de empleados, asignales una sucursal y gestioná permisos desde el panel de usuarios." },
      { icon: <BarChart3 className="h-4 w-4" />, title: "Revisá los reportes", desc: "Accedé a ventas del período, top 10 productos y kardex completo por sucursal para tomar decisiones." },
    ],
  },
]

export default function TutorialPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16 space-y-14">

      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="h1 text-foreground">¿Cómo usar FarMedic?</h1>
        <p className="body text-muted-foreground max-w-xl mx-auto">
          Guía rápida según tu rol en el sistema. Encontrá los pasos para empezar en minutos.
        </p>
      </div>

      {/* Secciones por rol */}
      {ROLES.map(({ label, color, badge, steps }) => (
        <section key={label} className={`rounded-xl border p-7 space-y-6 ${color}`}>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge}`}>
              {label}
            </span>
            <h2 className="h3 text-foreground">Para el {label}</h2>
          </div>

          <ol className="space-y-5">
            {steps.map(({ icon, title, desc }, i) => (
              <li key={title} className="flex gap-4">
                <div className="flex flex-col items-center gap-1">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background border text-foreground font-bold text-sm">
                    {i + 1}
                  </span>
                  {i < steps.length - 1 && (
                    <span className="w-px flex-1 bg-border" />
                  )}
                </div>
                <div className="pb-5 space-y-1">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    {icon}
                    {title}
                  </div>
                  <p className="small text-muted-foreground">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}

      {/* CTA */}
      <div className="rounded-lg border bg-card p-8 text-center space-y-3">
        <h2 className="h3 text-foreground">¿Listo para empezar?</h2>
        <p className="small text-muted-foreground">
          Accedé al sistema o explorá el catálogo sin necesidad de cuenta.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <a href="/login" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <LogIn className="h-4 w-4" />
            Iniciar sesión
          </a>
          <a href="/catalogo" className="inline-flex items-center gap-2 rounded-md border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors">
            <Search className="h-4 w-4" />
            Ver catálogo
          </a>
        </div>
      </div>

    </div>
  )
}
