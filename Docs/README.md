# FarMedic — Visión General

Sistema web de gestión para farmacias: inventario, POS y pedidos online.
Multi-sucursal. Ecuador / USD.

> **Fuente de verdad**: vault Obsidian en `__farmedic__db__backup/FarMedic/`. Este archivo es un snapshot.

## Stack
| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js (App Router) + TypeScript + shadcn/ui + Tailwind |
| Backend | Laravel + PostgreSQL + Sanctum |
| Auth | Laravel Socialite (Google OAuth) + login tradicional |

## Módulos
| # | Módulo | Usuarios |
|---|--------|----------|
| 1 | Inventario y Stock | Admin |
| 2 | Punto de Venta (POS) | Admin, Empleado |
| 3 | Catálogo y Pedidos Online | Cliente, Invitado |
| 4 | Gestión de Entregas | Admin, Empleado |
| 5 | Administración y Reportes | Admin |

## Arranque rápido
```bash
# Frontend
cd Frontend && npm run dev

# Backend
cd Backend && php artisan serve
```

Ver `README-Frontend.md` y `README-Backend.md` para setup completo.
