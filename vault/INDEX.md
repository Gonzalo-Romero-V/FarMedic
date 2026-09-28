---
type: index
status: locked
---

# FarMedic — Knowledge Index

**Vault**: `C:\Users\Gonzalo\Dev\__databases\__farmedic__db__backup\FarMedic`
**Code**: `C:\Users\Gonzalo\Dev\FarMedic`
**Repo**: https://github.com/Gonzalo-Romero-V/FarMedic.git

---

## Sistema
- [[SYSTEM]] — cómo funciona el vault y la sincronización (leer antes de modificar)

## Intent — H1 El Porqué
- [[vision]] — qué es, para quién, problema que resuelve
- [[roles]] — 4 actores del sistema y sus límites de acceso

## Domain — H2 El Qué

### Overview
- [[data-model]] — diagrama ER completo + lista de entidades + decisiones clave

### Tenencia y catálogo
- [[farmacia]] — entidad raíz (cadena)
- [[sucursal]] — local físico, ancla del multi-tenancy
- [[categoria]] — clasificación de medicamentos
- [[proveedor]] — fuente de medicamentos y lotes
- [[medicamento]] — producto del catálogo
- [[lote]] — partida con vencimiento

### Usuarios y acceso
- [[rol]] — Administrador / Empleado / Cliente
- [[usuario]] — actor interno (admin, empleado)
- [[cliente]] — actor externo (canal online)

### Operaciones
- [[venta]] — transacción POS
- [[venta-item]] — línea de venta
- [[pedido]] — orden online
- [[pedido-item]] — línea de pedido
- [[movimiento-stock]] — Kardex auditable
- [[receta]] — respaldo de transacciones con meds restringidos

## Decisions — H3 El Cómo
- [[stack]] — tecnologías elegidas por capa
- [[arquitectura]] — estructura, multi-tenancy, env, deploy
- [[design-system]] — shadcn/ui Radix Nova, theme system, aliases, dark mode
- [[git]] — repositorio, commits, .gitignore
- [[negocio]] — país, moneda, fechas, impuestos
- [[rbac]] — UI por rol: prefijos URL, permission map, defensa en profundidad

## Raw — Fuentes
- `raw/Requisitos y módulos.pdf` — documento base de requisitos (ESPOCH)
- `raw/LOGO.png`

---

## Protocolo para agentes

1. Leer este índice antes de cualquier tarea
2. Leer las notas relevantes al área de trabajo (no leer todo el vault)
3. Tras implementar: actualizar `code_path` en la nota correspondiente vía `/sync`
4. **Nunca modificar** notas con `status: locked`
5. Si una implementación contradice una nota de dominio → reportar, no resolver
6. Los `Docs/README*.md` son snapshots — la fuente de verdad semántica es este vault

**Sistema de sincronización**: ver [[SYSTEM]].
