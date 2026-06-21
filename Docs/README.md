# FarMedic — Visión General

Sistema web de gestión para farmacias: inventario, POS y pedidos online.
Multi-sucursal. Ecuador / USD.

> **Fuente de verdad**: vault Obsidian en `__farmedic__db__backup/FarMedic/`. Este archivo es un snapshot.

---

## Estado actual (junio 2026)

| Entorno | URL | Estado |
|---------|-----|--------|
| Producción Frontend | https://far-medic.vercel.app | ✅ Operativo |
| Producción Backend | https://farmedic.onrender.com | ✅ Operativo |
| Base de datos | Neon PostgreSQL (`sa-east-1`) | ✅ Operativo |

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 (App Router) + TypeScript + shadcn/ui + Tailwind |
| Backend | Laravel 13 + PostgreSQL + Sanctum (Bearer tokens) |
| Auth | Laravel Socialite (Google OAuth) + login tradicional |
| Deploy Backend | Docker (php:8.4-fpm-alpine + nginx + supervisord) en Render |
| Deploy Frontend | Vercel (auto-deploy desde `main`) |

## Módulos

| # | Módulo | Roles |
|---|--------|-------|
| 1 | Inventario y Stock | Administrador |
| 2 | Punto de Venta (POS) | Administrador, Empleado |
| 3 | Catálogo y Pedidos Online | Cliente, Invitado |
| 4 | Gestión de Entregas | Administrador, Empleado |
| 5 | Administración y Reportes | Administrador |

## Sucursales del sistema

| Sucursal | Ciudad | Estado |
|----------|--------|--------|
| Matriz | Riobamba | Activa |
| Sucursal Guano | Guano | Activa |

## Arranque rápido (local)

```bash
# Backend (puerto 8000)
cd Backend && php artisan serve

# Frontend (puerto 3000)
cd Frontend && npm run dev
```

Ver `Docs/despliegue.md` para setup completo, variables de entorno y guía de producción.
Ver `Docs/AUTH_CREDENTIALS.md` para credenciales de acceso.
