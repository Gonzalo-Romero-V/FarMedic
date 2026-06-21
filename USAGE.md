# Cómo interactúo con el sistema de grafo semántico

Este documento describe **cómo tú, desarrollador, operas el sistema vault-sync**. Es la única referencia que necesitas para el día a día.

---

## El modelo mental

```
┌─────────────────────────────────────────────────────────────┐
│  CÓDIGO (repo)         ←→         VAULT (segundo cerebro)   │
│  fuente de verdad técnica         fuente de verdad semántica │
└─────────────────────────────────────────────────────────────┘
                  ↕ vault-sync                   ↕
            change_report.json (determinista)
                  ↕
            propuesta de cambios (Claude)
                  ↕
            tu aprobación → script aplica
```

**Capas (jerarquía descendente):**
- **H1 — INTENT**: visión, reglas de negocio, invariantes (vault/intent/)
- **H2 — REQUISITOS**: requisitos funcionales y de dominio (vault/domain/, vault/raw/)
- **H3 — ARQUITECTURA**: decisiones de stack y patrones (vault/decisions/)
- **H4 — CONTRATOS**: modelos, migraciones, rutas, schemas (Backend/database/, Backend/app/Models/, etc.)
- **H5 — IMPLEMENTACIÓN**: controllers, componentes, servicios

**Regla de oro**: las capas superiores causan las inferiores. Cambios en H1–H3 son decisión tuya y se propagan hacia abajo. Cambios en H5 nunca contradicen H1–H3 silenciosamente.

---

## Comandos diarios

### `/sync` — después de cada commit aprobado

El git hook ya generó `change_report.json` automáticamente. Tú ejecutas:

```
/sync
```

Claude:
1. Lee el reporte
2. Identifica qué notas del vault deben actualizarse
3. **Te muestra la propuesta**
4. Tú apruebas (o pides ajustes)
5. El script aplica

Si el commit fue solo H5 (refactor de implementación), la propuesta puede ser **0 cambios al vault**. Eso está bien.

### `/check` — auditoría de coherencia

Cuando dudes que el código siga reflejando los requisitos:

```
/check
```

Claude corre los chequeos deterministas + analiza coherencia semántica entre capas y reporta:
- 🔴 **Contradicciones** — código hace algo que viola una regla del vault
- 🟡 **Drift** — algo en el vault sin reflejo en código (o al revés)
- 🟢 **Coherente** — todo OK

**`/check` no resuelve nada solo.** Reporta y tú decides.

### `/ingest <ruta>` — agregaste un documento nuevo

Cuando agregas un PDF, .txt o imagen en `vault/raw/`:

```
/ingest raw/nuevo-documento.pdf
```

Claude lee el contenido, extrae conceptos, propone agregar/enriquecer notas. Tú apruebas.

### `/snapshot` — solo en momentos especiales

- Al iniciar un proyecto nuevo
- Después de un refactor masivo
- Cuando sospechas que el grafo perdió sincronía con el código

```
/snapshot
```

Claude regenera el mapeo completo concepto ↔ código. **Operación cara en tokens** — usar con criterio.

---

## Comandos manuales (sin Claude)

```bash
# Ver estado del sistema
python scripts/vault_sync.py status

# Generar reporte manualmente (lo hace el git hook automáticamente)
python scripts/vault_sync.py report

# Validar un reporte
python scripts/vault_sync.py validate .vault-sync/change_report.json

# Correr solo los checks deterministas
python scripts/vault_sync.py check

# Aplicar un changes.json aprobado
python scripts/vault_sync.py apply .vault-sync/proposed-changes.json
```

---

## Reglas que el sistema respeta SIEMPRE

1. **Nunca** modifica notas con `status: locked`. Si tu `/sync` propone tocar una, cancélala tú.
2. **Nunca** borra una nota. Como mucho, la marca `deprecated`.
3. **Nunca** sobrescribe el cuerpo entero de una nota. Solo: configura el frontmatter y agrega secciones.
4. **Idempotente**: aplicar el mismo `changes.json` dos veces no produce cambios duplicados.
5. **Falla ruidosa**: si algo no cuadra, aborta y loguea. No adivina.
6. **Logs en `.vault-sync/sync.log`**: revisa ahí cuando dudes qué pasó.

---

## Estados de las notas

| `status` | Significado | Quién la modifica |
|----------|-------------|-------------------|
| `draft` | Borrador | Claude libremente |
| `stable` | Activa | Claude solo `code_path` y secciones append |
| `locked` | Inmutable | Solo tú manualmente |
| `deprecated` | Obsoleta, queda como histórico | Nadie la actualiza |

---

## Flujo cotidiano completo

```
1. Codificas un cambio
2. Me pides un commit → te muestro el mensaje → apruebas
3. git commit (post-commit hook genera change_report.json)
4. Si el cambio amerita actualizar vault → /sync
5. Reviso propuesta de Claude
6. Apruebo o ajusto
7. Vault actualizado
8. (Opcional) /check si toqué algo crítico
```

**Antes de cualquier acción de impacto** (commit, push, sync, ingest), Claude **siempre** te pide aprobación explícita.

---

## Replicar este sistema en otro proyecto

Copia a la raíz del nuevo proyecto:
- `scripts/` (la carpeta entera)
- `.claude/commands/` (los 4 skills)
- `.git/hooks/post-commit`
- `vault_sync.config.json` (ajusta `vault_path`, `project_name`, mapeos)
- `CLAUDE.md` (ajusta referencias)
- `USAGE.md` (este archivo)

Crea el vault Obsidian con: `INDEX.md`, `intent/`, `domain/`, `decisions/`, `raw/`.
Ejecuta `python scripts/vault_sync.py status` para verificar que todo arranca.
