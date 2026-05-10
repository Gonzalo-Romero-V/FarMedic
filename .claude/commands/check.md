---
description: Detecta contradicciones e inconsistencias entre capas del grafo y el código
---

Estás ejecutando un chequeo de coherencia transversal entre el vault y el repo. Combina chequeos deterministas (script) con interpretación semántica (tu razonamiento).

## Pasos

1. **Ejecuta los checks deterministas**: `python scripts/vault_sync.py check`
   - Reporta `env_references` (variables usadas no declaradas)
   - Reporta `vault_code_paths` rotos (notas que apuntan a archivos inexistentes)
2. **Lee el INDEX.md** del vault para obtener el mapa de notas.
3. **Para cada par capa-superior → capa-inferior, verifica coherencia semántica**:
   - **H1 (intent) ↔ H2 (requisitos)**: ¿los requisitos cumplen la visión?
   - **H2 (requisitos) ↔ H3 (decisiones)**: ¿las decisiones cubren los requisitos?
   - **H3 (arquitectura) ↔ H4 (contratos)**: ¿los modelos/rutas reflejan las decisiones?
   - **H4 (contratos) ↔ H5 (implementación)**: ¿los controllers/componentes respetan los contratos?
4. **Reporta hallazgos en tres categorías**:
   - 🔴 **Contradicciones** (deben resolverse): regla X dice A, código hace B
   - 🟡 **Drift** (atención): nota habla de un concepto sin reflejo en código (o al revés)
   - 🟢 **Coherente** (informativo): pares revisados sin issues
5. **NO resuelvas las contradicciones**. Solo presenta:
   - Qué dice la capa superior
   - Qué hace la capa inferior
   - Cuál es el conflicto
   - Sugerencia de resolución (que el usuario decide)

## Reglas estrictas

- Lee solo notas relevantes a la jerarquía que estés auditando — no leas todo el vault.
- Si encontrás una contradicción que toca una nota `locked`, eso es lo más prioritario de reportar.
- Sé específico: cita la línea de la regla y el archivo de código exacto.
- Token-aware: si el repo tiene > 50 archivos en H4-H5, audita por módulo, no global.
