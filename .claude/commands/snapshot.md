---
description: Captura el estado actual del repositorio y propone notas iniciales del vault
---

Estás ejecutando el snapshot inicial del proyecto. Tu tarea es capturar el estado actual del código y proponer (no aplicar) las notas que faltan en el vault para que el grafo refleje fielmente la realidad del repo.

## Pasos

1. **Lee `vault_sync.config.json`** para conocer el vault_path y el mapeo de jerarquía.
2. **Genera el reporte** ejecutando: `python scripts/vault_sync.py report`
   - Lee `.vault-sync/change_report.json` resultante.
3. **Lee el INDEX.md actual** del vault y todas las notas existentes (`intent/`, `domain/`, `decisions/`).
4. **Mapea código → vault**:
   - Para cada archivo importante en H4 (modelos, migraciones, rutas) o H5 (controllers, componentes), identifica si ya existe una nota de dominio que lo describa.
   - Si existe → propón actualizar `code_path` en su frontmatter.
   - Si no existe pero el archivo representa un concepto del dominio → propón crear una nueva nota.
5. **Identifica gaps**:
   - Variables de `.env.example` no documentadas en el vault.
   - Módulos del PDF de requisitos sin nota correspondiente.
   - Decisiones de stack sin reflejo en `decisions/`.
6. **Produce un `changes.json`** propuesto en `.vault-sync/proposed-changes.json` con operaciones tipo:
   ```json
   {
     "operations": [
       {"action": "update_frontmatter", "note": "domain/medicamento.md", "set": {"code_path": "Backend/app/Models/Medicamento.php"}},
       {"action": "create", "path": "domain/usuario.md", "content": "---\nstatus: stable\n---\n\n# Usuario..."}
     ]
   }
   ```
7. **Muestra el resumen al usuario** y pide aprobación antes de ejecutar `python scripts/vault_sync.py apply .vault-sync/proposed-changes.json`.

## Reglas estrictas

- **Nunca** modifiques notas con `status: locked`.
- **Nunca** borres una nota; usa `deprecate` si está obsoleta.
- Si una propuesta contradice una nota `locked`, detente y reporta la contradicción al usuario.
- No leas el vault completo de golpe — usa el reporte y las notas relevantes.
