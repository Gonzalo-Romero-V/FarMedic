---
status: stable
---

# Git

**Repositorio**: https://github.com/Gonzalo-Romero-V/FarMedic.git
**Estrategia**: Monorepo, rama principal `main`
**Commits**: Inglés, minimalistas, con prefijo semántico:
- `feat:` — nueva funcionalidad
- `fix:` — corrección de bug
- `refactor:` — refactorización sin cambio de comportamiento
- `docs:` — solo documentación
- `style:` — formato, estilos sin lógica
- `chore:` — mantenimiento (deps, config, scaffolding)

**.gitignore**: Un solo archivo en la raíz, con secciones comentadas: Frontend | Backend | Servicios | OS/Editor
**Docs**: `Docs/` contiene READMEs resumen (global, frontend, backend). Son snapshots — la fuente de verdad es el vault Obsidian.
