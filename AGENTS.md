# FarMedic — Guía para agentes de IA

> Esta guía es **canónica** y la lee cualquier CLI de IA que abra el repo
> (Claude Code, Codex CLI, etc.). `CLAUDE.md` la importa con `@AGENTS.md`.

---

## ⚠️ Pre-flight obligatorio (antes de tocar código)

El proyecto tiene un **vault Obsidian** como fuente de verdad semántica.
El código (H4–H5) refleja al vault (H1–H3), nunca al revés.
**Saltar este protocolo produce código que contradice contratos documentados.**

Toda sesión nueva, antes de la primera respuesta no-trivial, debe:

1. **Leer este archivo completo** — ya estás acá, sigamos.
2. **Leer `vault/INDEX.md`** (`C:\Users\Gonzalo\Dev\__databases\__farmedic__db__backup\FarMedic\INDEX.md`).
3. **Identificar la tarea** y consultar la tabla de abajo para saber qué notas leer.
4. **Leer SOLO esas notas** — no leer el vault completo, no inventar.
5. **Recién entonces** explorar código del repo.

Si la tarea es trivial y no toca dominio (cambiar un copy, fix de import, etc.),
los pasos 3-5 son opcionales — usá criterio.

---

## Qué notas leer según la tarea

| Tarea | Notas obligatorias |
|-------|---------------------|
| Endpoint REST nuevo / modificado | `decisions/api-contracts.md` + `decisions/rbac.md` + `domain/<entidad>.md` por cada entidad |
| Tocar `Backend/app/Models/X.php` | `domain/<entidad>.md` correspondiente |
| Tocar `Backend/app/Http/Controllers/Api/XController.php` | `domain/<entidad>.md` + `decisions/api-contracts.md` |
| Migration / schema | `domain/data-model.md` + `domain/<entidad>.md` afectadas |
| `Frontend/components/layout/` o `auth/` | `decisions/rbac.md` + `decisions/arquitectura.md` |
| `Frontend/app/(private|public)/...` | `decisions/rbac.md` + `decisions/design-system.md` |
| Theme / shadcn / tipografía / colores | `decisions/design-system.md` |
| Multi-tenancy / sucursales | `domain/farmacia.md` + `domain/sucursal.md` + `decisions/arquitectura.md` |
| Auth / OAuth / sesiones | `decisions/auth.md` + `decisions/rbac.md` |
| Stack / dependencias nuevas | `decisions/stack.md` |
| Reglas de país / moneda / impuestos | `decisions/negocio.md` |

Si una nota referenciada no existe → **preguntar al humano**, no inventar.

---

## Regla de oro: contradicción → reportar, no resolver

Si el código actual contradice una nota del vault con `status: stable` o `locked`:
1. Parar.
2. Reportar al humano qué nota dice qué y qué código contradice.
3. Esperar decisión.

Resolver unilateralmente es **prohibido** (SYSTEM.md, regla 3).

---

## Estados de las notas

| Status | Edición |
|--------|---------|
| `draft` | Modificable libremente vía `/sync` |
| `stable` | Solo `code_path` y `append_section` vía `/sync` |
| `locked` | Inmutable — solo edición humana directa |
| `deprecated` | Histórico — nadie la actualiza |

Operaciones prohibidas siempre:
- Borrar archivos del vault
- Sobrescribir cuerpo completo de una nota
- Modificar notas `locked`

---

## Flujo de trabajo cotidiano

```
1. Recibís tarea
2. Pre-flight (arriba) → leer vault relevante
3. Implementás código
4. Pedís al humano permiso para commit + proponés mensaje
5. git commit
   └─ post-commit hook genera .vault-sync/change_report.json automáticamente
6. /sync skill → propone cambios al vault basados en el reporte
7. Humano revisa propuesta → aprueba o ajusta
8. apply ejecuta → vault queda alineado al código
```

**Después de cada commit no-trivial, sugerí al humano correr `/sync`** para que el grafo refleje el estado actual. Si no se hace, el vault drift y la próxima sesión de IA tendrá contexto desactualizado.

Si el commit fue solo refactor de implementación (H5), `/sync` puede proponer 0 cambios — eso es correcto.

---

## Reglas inviolables (resumen)

1. **Antes de tocar dominio**: leer las notas correspondientes del vault.
2. **Antes de cualquier commit / push**: pedir confirmación explícita al humano.
3. **Nunca** modificar notas con `status: locked`.
4. **Nunca** borrar notas (usar `deprecate` si hace falta).
5. **Nunca** commitear secrets (`Backend/.env`, `Frontend/.env.local`).
6. **Solo proponer** cambios al vault; la aplicación la hace `apply` tras aprobación.
7. **Preferir scripts deterministas** (`scripts/vault_sync.py`) sobre razonamiento LLM cuando la operación es estructural (extracción de modelos, migraciones, rutas, imports).

---

## Skills disponibles

| Skill | Cuándo usar |
|-------|-------------|
| `/snapshot` | Solo en arranque de proyecto, refactor masivo, o sospecha de drift severo. Caro en tokens. |
| `/sync` | Después de cada commit aprobado. El flujo natural de mantenimiento del grafo. |
| `/ingest <ruta>` | Después de dropear un PDF / .txt / imagen en `vault/raw/`. |
| `/check` | Cuando dudes de la coherencia entre código y vault. Solo reporta, no resuelve. |

Más detalle en `USAGE.md` (cara dev) y `vault/SYSTEM.md` (cara agente).

---

## Contexto rápido del proyecto

### Vault y código

- **Vault**: `C:\Users\Gonzalo\Dev\__databases\__farmedic__db__backup\FarMedic`
- **Sistema vault-sync**: `vault/SYSTEM.md` (locked, leer una vez)
- **Manual de uso humano**: `USAGE.md`
- **Engine determinista**: `scripts/vault_sync.py` (0 deps)
- **Estado en vivo**: `.vault-sync/facts.json` — modelos, migraciones, rutas, UI primitives, imports graph (no leer el código si la respuesta está acá)

### Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui |
| Backend | Laravel 13 + PostgreSQL + Sanctum |
| Auth | Laravel Socialite (Google OAuth) + login tradicional |
| Real-time | React Query polling (pendiente de instalar) |
| Storage | Local |
| País | Ecuador, USD, DD/MM/YYYY, `America/Guayaquil` |

### Estructura del monorepo

```
FarMedic/
├── Frontend/                ← Next.js 16  (AGENTS.md propio)
├── Backend/                 ← Laravel 13
├── Docs/                    ← READMEs snapshot
├── scripts/                 ← vault_sync engine (Python, 0 deps)
├── .claude/commands/        ← /snapshot /sync /ingest /check
├── .git/hooks/post-commit   ← genera change_report automáticamente
├── .vault-sync/             ← reportes y logs (no versionado)
├── vault_sync.config.json   ← config del sistema
├── AGENTS.md                ← este archivo (canónico)
├── CLAUDE.md                ← `@AGENTS.md`
└── USAGE.md                 ← guía del desarrollador humano
```

### Convenciones

- **Multi-tenancy**: `sucursal_id` obligatorio en todos los modelos operativos (Medicamento, Lote, Venta, Pedido, Usuario empleado). Una `Farmacia` tiene N `Sucursal`.
- **Commits**: en inglés, minimalistas, prefijos `feat: fix: refactor: docs: style: chore:`.
- **Branch principal**: `main`.
- **Repo**: https://github.com/Gonzalo-Romero-V/FarMedic.git
- **Env vars en el vault**: solo se documentan **referencias** (qué nombre, dónde se usa), nunca valores. Los archivos `.env` no se commitean.
- **Scaffolding**: por CLI cuando exista (`create-next-app`, `composer create-project`, `shadcn add`). No crear estructura a mano si hay comando.

---

## Por qué este protocolo existe (anti-patrón histórico)

Sin pre-flight, una IA típicamente:
1. Inventa enums (ej. `Pedido.estado = "preparando|listo"` cuando el canónico es `pendiente|en_camino|entregado|cancelado`).
2. Duplica endpoints o contradice la matriz de protección RBAC.
3. Deja el vault desactualizado, drifteando capa H4 vs H2.

El vault existe precisamente para que la próxima sesión de IA pueda recuperar contexto en **pocos tokens** (notas concisas, hipervínculos `[[entidad]]`, índice). Cada vez que se salta `/sync`, se rompe ese contrato.
