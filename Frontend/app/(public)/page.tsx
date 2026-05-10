import Link from "next/link";
import { ArrowRight, ShieldCheck, Package, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="small text-brand mb-3">Sistema de gestión farmacéutica</p>
        <h1 className="h1 text-foreground">
          Inventario, ventas y pedidos en un mismo lugar
        </h1>
        <p className="body mt-4 text-muted-foreground">
          FarMedic unifica el control de stock, el mostrador y el canal online de tu
          farmacia. Trazabilidad por lote, alertas de caducidad y pedidos online — desde
          una sola interfaz.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/login">
              Iniciar sesión
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/tutorial">Ver tutorial</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-3">
        <Feature
          icon={<Package className="h-5 w-5" />}
          title="Inventario trazable"
          body="Control de lotes, caducidades y ubicación física por sucursal."
        />
        <Feature
          icon={<Sparkles className="h-5 w-5" />}
          title="POS ágil"
          body="Búsqueda por principio activo, carrito y comprobante PDF."
        />
        <Feature
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Pedidos online"
          body="Catálogo público, retiro en local o envío a domicilio."
        />
      </div>
    </section>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
        {icon}
      </span>
      <h3 className="h4 mt-4 text-foreground">{title}</h3>
      <p className="small mt-2 text-muted-foreground">{body}</p>
    </div>
  );
}
