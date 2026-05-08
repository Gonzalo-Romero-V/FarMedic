# FarMedic — Claude Guide

## Fuente de verdad
El vault Obsidian es la fuente de verdad del proyecto. Los `Docs/README*.md` son snapshots secundarios.

- **Vault**: `C:\Users\Gonzalo\Dev\__databases\__farmedic__db__backup\FarMedic`
- **Leer `INDEX.md` del vault antes de cualquier tarea**
- **Tras implementar un concepto: actualizar `code_path` en su nota de dominio**
- Actualizar los READMEs en `Docs/` después de cambios estructurales relevantes

## Stack
| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui |
| Backend | Laravel (PHP) + PostgreSQL + Sanctum |
| Auth | Laravel Socialite (Google OAuth) + login tradicional |
| Dark mode | next-themes |
| Real-time | React Query polling (`refetchInterval`) — sin WebSockets |
| Storage | Local (filesystem Laravel) |

## Estructura del monorepo
```
FarMedic/
├── Frontend/    ← Next.js
├── Backend/     ← Laravel
├── Docs/        ← READMEs resumen (snapshots)
└── CLAUDE.md
```

## Reglas de env
- `Frontend/.env.local` — variables Next.js (nunca comitear)
- `Backend/.env` — variables Laravel (nunca comitear)
- Servicios extra: su propio `.env` en su carpeta

## Multi-tenancy
`sucursal_id` obligatorio en todos los modelos operativos (Medicamento, Lote, Venta, Pedido, Usuario empleado).
Una `Farmacia` tiene N `Sucursal`. Todo dato operativo pertenece a una sucursal.

## Git
- Commits en **inglés**, minimalistas, con prefijo: `feat:` `fix:` `refactor:` `docs:` `style:` `chore:`
- Scaffolding siempre por CLI cuando exista comando (`create-next-app`, `composer create-project`, `shadcn add`)
- Rama principal: `main`

## Reglas de escritura en el vault
| `status` | Claude puede |
|----------|-------------|
| `draft` | Leer y modificar libremente |
| `stable` | Solo actualizar `code_path` |
| `locked` | Solo leer |

Si una implementación contradice una nota de dominio → reportar al usuario antes de proceder.

## Contexto de negocio
- País: Ecuador | Moneda: USD | Fecha: DD/MM/YYYY | TZ: America/Guayaquil
- Deploy semi-producción: Windows 10 + Cloudflare Tunnel (Argo)
