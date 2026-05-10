# FarMedic — Claude Guide

## Sistema vault-sync (LEER PRIMERO)
Este proyecto usa un sistema de sincronización determinista entre código y un vault Obsidian.

- **Vault**: `C:\Users\Gonzalo\Dev\__databases\__farmedic__db__backup\FarMedic`
- **Cómo funciona el sistema**: `vault/SYSTEM.md`
- **Cómo lo usa el desarrollador**: `USAGE.md` (en raíz del repo)
- **Skills disponibles**: `/snapshot`, `/sync`, `/ingest`, `/check`
- **Antes de cualquier tarea**: leer `INDEX.md` del vault y las notas relevantes
- **Antes de cualquier commit/push**: pedir confirmación explícita al usuario

## Reglas inviolables
1. **Nunca** modificar notas con `status: locked` en el vault
2. **Nunca** borrar notas (usar `deprecate` si es necesario)
3. **Nunca** commitear/pushear sin aprobación explícita del usuario
4. **Siempre** preferir scripts deterministas (`scripts/vault_sync.py`) sobre razonamiento LLM cuando la operación es estructural
5. **Solo proponer** cambios al vault. La aplicación la hace `apply` tras aprobación humana

## Stack
| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui |
| Backend | Laravel 13 + PostgreSQL + Sanctum |
| Auth | Laravel Socialite (Google OAuth) + login tradicional |
| Real-time | React Query polling |
| Storage | Local |
| País | Ecuador, USD, DD/MM/YYYY, America/Guayaquil |

## Estructura del monorepo
```
FarMedic/
├── Frontend/                ← Next.js 16
├── Backend/                 ← Laravel 13
├── Docs/                    ← READMEs snapshot
├── scripts/                 ← vault_sync engine (Python, 0 deps)
│   ├── vault_sync.py
│   └── lib/
├── .claude/
│   ├── commands/            ← /snapshot /sync /ingest /check
│   └── settings.json        ← hooks
├── .git/hooks/post-commit   ← genera change_report automáticamente
├── .vault-sync/             ← reportes y logs (no versionado)
├── vault_sync.config.json   ← config del sistema
├── USAGE.md                 ← guía para el desarrollador
└── CLAUDE.md                ← este archivo
```

## Flujo cotidiano
1. Codeás un cambio
2. Pedís commit → muestro mensaje propuesto → aprobás
3. `git commit` (post-commit hook genera `.vault-sync/change_report.json`)
4. Si el cambio amerita actualizar vault → `/sync`
5. Reviso propuesta → aprobás → `apply` ejecuta

## Multi-tenancy (regla de dominio)
`sucursal_id` obligatorio en todos los modelos operativos: `Medicamento`, `Lote`, `Venta`, `Pedido`, `Usuario empleado`. Una `Farmacia` tiene N `Sucursal`.

## Git
- Commits en **inglés**, minimalistas, prefijos: `feat:` `fix:` `refactor:` `docs:` `style:` `chore:`
- Scaffolding por CLI cuando exista comando
- Rama principal: `main`
- Repo: https://github.com/Gonzalo-Romero-V/FarMedic.git

## Reglas de env
- `Frontend/.env.local` y `Backend/.env` — nunca commitear, nunca incluir valores en el vault
- En el vault solo se documentan **referencias** de variables (qué nombre, dónde se usa), no valores
