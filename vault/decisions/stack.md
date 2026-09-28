---
status: stable
---

# Stack

**Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Radix UI
**Backend**: Laravel (PHP) + PostgreSQL + Sanctum
**Auth**: Laravel Socialite (Google OAuth) + login tradicional — todo el auth vive en el backend
**Estilos globales**: CSS custom properties en `globals.css` + `tailwind.config.ts` (colores, tipografía, tamaños, dark/light)
**Dark mode**: `next-themes`
**Storage**: Local (filesystem Laravel)
**Real-time**: Polling con React Query (`refetchInterval`) — sin WebSockets en esta fase
**AI (futuro)**: Google AI Studio API o OpenAI API, alternando según caso
**Servicios extra (futuro)**: Python independiente si aplica

Relaciones: [[arquitectura]] [[negocio]]

## Dependencias agregadas - commit 9af2edb 2026-05-17
Dos dependencias nuevas para cerrar admin:

**Backend** (composer):
- `barryvdh/laravel-dompdf` ^3.1 — generación de PDF server-side para reportes mensuales. Zero deps externas (no Node, no Puppeteer, no Chromium). Suficiente para tablas + estilos básicos. Implementación en `ReportesController::mensualPdf()` con template Blade `resources/views/reportes/mensual.blade.php`. Detalles en [[api-contracts]].

**Frontend** (npm):
- `leaflet` ^1.9.4 + `react-leaflet` ^5.0.0 + `@types/leaflet` — mapa interactivo open-source con tiles OpenStreetMap, sin API key. Usado en `/admin/sucursales` para mostrar marcadores con popups por sucursal y para el pick-on-map del form de alta/edit. Requiere dynamic import con `ssr: false` en Next.js (Leaflet usa `window` en initialization). Detalles en [[frontend-modules]] sección sucursales.
