---
description: Aplica cambios al vault basados en el último change_report.json (post-commit)
---

Estás sincronizando el vault con el último commit. El reporte determinista ya fue generado por el git hook.

## Pasos

1. **Lee `.vault-sync/change_report.json`**. Si no existe → ejecuta `python scripts/vault_sync.py report` primero.
2. **Valida el reporte**: `python scripts/vault_sync.py validate .vault-sync/change_report.json`. Si falla → aborta y reporta.
3. **Examina sólo lo que importa**:
   - `commit.message` y `commit.id`
   - `scope.by_layer` para entender qué capas se tocaron
   - `vault_hints.potentially_affected` — son las notas que probablemente necesitan update
   - `vault_hints.must_not_touch` — locked, no las toques bajo ningún motivo
4. **Para cada nota en `potentially_affected`**:
   - Léela.
   - Decide qué cambia: ¿`code_path` desactualizado? ¿una sección de "Notes" debe añadirse? ¿es deprecación?
5. **Si los cambios atraviesan jerarquía** (ej. cambió un H3 o H4):
   - Verifica que las notas de capas inferiores siguen siendo coherentes con la decisión.
   - Si detectas una contradicción semántica → repórtala, no la resuelvas.
6. **Genera `.vault-sync/proposed-changes.json`** con las operaciones concretas.
7. **Resume al usuario**:
   - Qué notas se actualizan
   - Qué se crea
   - Qué se deprecia
   - Cualquier contradicción detectada
8. **Pide aprobación**. Si aprueba → `python scripts/vault_sync.py apply .vault-sync/proposed-changes.json`.

## Reglas estrictas

- Operaciones permitidas: `update_frontmatter`, `append_section`, `deprecate`, `create`. **Nunca** sobrescribir cuerpo completo, **nunca** borrar.
- Si el reporte tiene `consistency.structural_checks.failed` no vacío → menciónaselo al usuario antes de proponer cambios.
- Si el commit tocó solo H5 (implementación pura), tal vez el vault no necesite cambios. Es válido proponer 0 operaciones.
- Idempotencia: si la nota ya tiene el valor que queres setear, no propongas la operación.
