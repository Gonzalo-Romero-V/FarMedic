---
description: Ingiere un documento nuevo de raw/ al grafo semántico del vault
argument-hint: <ruta del archivo en vault/raw/>
---

Estás ingiriendo un documento nuevo a la base de conocimiento. El usuario agregó un archivo en `vault/raw/` (PDF, txt, imagen, etc.) y querés extraer su contenido semántico al grafo.

## Pasos

1. **Lee el archivo** indicado en el argumento (ruta relativa al vault).
2. **Identifica el tipo de información**:
   - ¿Es contexto de negocio? → relevante a `intent/` o `domain/`
   - ¿Es decisión técnica externa? → relevante a `decisions/`
   - ¿Es referencia o material de soporte? → puede quedarse solo en `raw/`
3. **Lee el INDEX.md y las notas relevantes** ya existentes para no duplicar información.
4. **Extrae entidades, reglas y relaciones**:
   - ¿Hay nuevas entidades de dominio?
   - ¿Hay reglas que contradicen reglas existentes?
   - ¿Hay decisiones implícitas?
5. **Propón operaciones** en `.vault-sync/proposed-changes.json`:
   - `create` para conceptos nuevos
   - `append_section` para enriquecer notas existentes
   - **NUNCA** `deprecate` automáticamente; eso es decisión tuya, ingest, solo agrega.
6. **Reporta contradicciones encontradas** al usuario explícitamente — no resuelvas, solo flagea.
7. **Resume y pide aprobación** antes de aplicar.

## Reglas estrictas

- No toques notas `locked`.
- Si el documento parece reescribir una regla existente → repórtalo como contradicción, no como update.
- Mantén los enlaces wiki (`[[nota]]`) consistentes con las notas que existen en el vault.
