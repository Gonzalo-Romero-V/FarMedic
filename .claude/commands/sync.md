---
description: Aplica cambios al vault basados en change_report.json + facts.json (post-commit)
---

Estás sincronizando el vault con el último commit. El git hook ya generó dos artefactos deterministas que **debés leer antes de proponer nada**:

- `.vault-sync/change_report.json` — qué cambió (archivos, capa, diff resumido)
- `.vault-sync/facts.json` — qué hay realmente en el repo (UI primitives, aliases, theme tokens, modelos, migraciones, grafo de imports, etc.)

## Pasos

1. **Validá el reporte**: `python scripts/vault_sync.py validate .vault-sync/change_report.json`. Si falla → aborta.
2. **Leé `change_report.json`** y quedate con:
   - `commit.message` y `commit.id`
   - `scope.by_layer` — qué capas se tocaron
   - `vault_hints.potentially_affected` — notas candidatas
   - `vault_hints.must_not_touch` — notas locked, intocables
3. **Leé `facts.json`** para entender el estado semántico:
   - `frontend.shadcn` — config del design system (style, aliases, icon library, css path)
   - `frontend.tsconfig_aliases` — paths del proyecto
   - `frontend.theme` — imports CSS, dark mode strategy, tokens del tema
   - `frontend.ui_primitives` — qué componentes existen disponibles
   - `frontend.lib_utilities` — qué utilidades exporta `lib/`
   - `import_graph[file]` — qué importa cada archivo, distinguiendo external / internal_alias / relative
   - `backend.models`, `backend.migrations`, `backend.routes`
4. **Para cada nota en `potentially_affected`** decidí qué cambia (`code_path`, sección, deprecación).
5. **Si el commit incorpora una capa nueva al sistema** (ej: shadcn instalado, sidebar agregado, modelo nuevo), considerá si:
   - Falta una nota en `decisions/` que documente la decisión arquitectónica (qué design system, qué aliases)
   - Falta una nota en `domain/` que enlace una entidad de código nueva
   - Una nota existente debe actualizar su `code_path` o agregarse una sección "Implementación"
6. **Si los cambios atraviesan jerarquía** (H3 o superior), validá coherencia con notas H1–H2.
7. **Generá `.vault-sync/proposed-changes.json`** con operaciones concretas.
8. **Resumí al usuario**:
   - Qué notas se actualizan
   - Qué se crea
   - Qué se deprecia
   - Contradicciones detectadas (no resolvés, solo flageás)
9. **Pedí aprobación**. Si aprueba → `python scripts/vault_sync.py apply .vault-sync/proposed-changes.json`.

## Reglas estrictas

- Operaciones permitidas: `update_frontmatter`, `append_section`, `deprecate`, `create`. **Nunca** sobrescribir cuerpo, **nunca** borrar.
- Si el reporte tiene `consistency.structural_checks.failed` no vacío → mencionalo antes de proponer.
- Si el commit tocó solo H5, el vault puede no necesitar cambios. Es válido proponer 0 operaciones.
- Idempotencia: si la nota ya tiene el valor que querés setear, no propongas la operación.
- **No leas el código fuente** salvo necesidad puntual — los facts ya tienen lo extraíble determinísticamente.
