# FarMedic — Frontend

**Stack**: Next.js 14+ (App Router) · TypeScript · Tailwind CSS · shadcn/ui · next-themes

> Snapshot — fuente de verdad en vault Obsidian.

## Setup
```bash
# Scaffolding (solo primera vez)
npx create-next-app@latest Frontend --typescript --tailwind --app --src-dir --import-alias "@/*"
cd Frontend
npx shadcn@latest init

# Agregar componentes
npx shadcn@latest add <componente>

# Desarrollo
npm run dev
```

## Variables de entorno
Crear `Frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Estructura clave
```
Frontend/
├── src/
│   ├── app/          ← rutas (App Router)
│   ├── components/   ← componentes shadcn + propios
│   ├── lib/          ← utils, api client
│   └── styles/       ← globals.css (CSS variables)
└── tailwind.config.ts
```

## Estilos globales
CSS custom properties en `globals.css` para colores, tipografía y espaciado.
Dark/light mode via `next-themes` con clase `dark` en `<html>`.
