---
status: stable
code_path: Frontend/components/custom/
---

# Patrón de módulos frontend

**Qué**: Convención canónica para implementar features modulares en `Frontend/components/`. Cada feature vive en una carpeta propia con componentes presentacionales server, una sola isla cliente que orquesta datos, y tipos co-localizados.

**Por qué**: Mantener el código modular, legible y consistente entre roles y módulos. Evitar pages-monolito ("spaghetti") y centralizar las decisiones de fetch/rendering. Servir como contrato para que cualquier rol (admin, empleado, cliente) o feature (dashboard, POS, inventario, reportes) siga el mismo patrón sin reinventar estructura.

## Estructura canónica de carpetas

```
Frontend/components/
├── ui/                              # H4 — shadcn primitives (no editar)
├── layout/                          # H4 — chrome (header-*, aside-*, shells)
├── custom/                          # H4–H5 — todo lo "nuestro"
│   ├── <componente-generico>.tsx    # transversales: theme-provider, dark-light-toggle, page-placeholder
│   └── <rol>/                       # admin | empleado | cliente
│       └── <feature>/               # dashboard | pos | inventario | reportes | pedidos | …
│           ├── <componente>.tsx              # piezas presentacionales (server)
│           ├── use-<rol>-<feature>.ts        # hook client: fetch + adapt snake→camel
│           └── <feature>-data.tsx            # isla cliente: consume hook + delega a presentacionales
```

**Reglas de ubicación:**
1. Componentes transversales (usados por todos los roles): directo bajo `custom/`.
2. Específicos de rol: `custom/<rol>/<feature>/`.
3. Si un feature es genuinamente cross-rol (excepción rara), considerar `custom/<feature>/` y dejarlo justificado acá.

## Reglas por módulo

| Regla | Detalle |
|-------|---------|
| Server-first | Componentes presentacionales son server components (sin `"use client"`) salvo que necesiten estado/hooks. |
| Isla cliente única | Una sola `"use client"` por feature, típicamente `<feature>-data.tsx`. Encapsula el fetch, loading, error y delega render. |
| Tres estados | Cada sección acepta `items?: T[]`: `undefined` → skeleton, `[]` → empty state, `[...]` → datos. Desacopla loading de empty real. |
| Hook por feature | `use-<rol>-<feature>.ts` hace fetch via `lib/api.ts` y mapea `snake_case` (Laravel) → `camelCase` (frontend). API no filtra al UI sin pasar por el adapter. |
| Tipos co-localizados | Cada componente exporta su tipo (`StockCriticoItem`, `PedidoPendiente`, etc.). El hook los importa para tipar el shape canónico. |
| Page solo maqueta | `app/(private)/<rol>/<feature>/page.tsx` queda server y solo compone componentes. Sin lógica de datos. |
| Enums canónicos | Cualquier enum (estados, tipos) viene del vault (`domain/<entidad>.md`). Nunca inventar valores. |

## Soporte transversal

| Pieza | Path | Rol |
|-------|------|-----|
| Fetch helper | `Frontend/lib/api.ts` | `apiFetch<T>()` con Bearer desde localStorage + clase `ApiError`. Base URL desde `NEXT_PUBLIC_API_URL`. Wrapper canónico para todos los hooks de datos. |
| Auth context | `Frontend/hooks/use-auth.tsx` | Provee token + user. Los hooks de features pueden delegarle la lectura si necesitan reaccionar al estado. |
| Permission map | `Frontend/lib/permissions/index.ts` | `usePermissions().can(perm)` para mostrar/ocultar UI. Detalle en [[rbac]]. |
| Theme | `Frontend/components/custom/theme-provider.tsx` | Wrapper de next-themes. Detalle en [[design-system]]. |

## Módulos implementados

| Rol | Módulo | Carpeta | Endpoint | Estado |
|-----|--------|---------|----------|--------|
| admin | dashboard | `custom/admin/dashboard/` | `GET /api/admin/dashboard` ([[api-contracts]]) | ✅ 2026-05-13 |

Al sumar POS, inventario, reportes, pedidos del cliente, etc., agregar fila acá vía `/sync`.

## Cómo agregar un módulo nuevo (checklist)

1. Leer `domain/<entidad>.md` de cada entidad involucrada (enums, invariantes) y `decisions/rbac.md` para el rol.
2. Crear carpeta `Frontend/components/custom/<rol>/<feature>/`.
3. Implementar componentes presentacionales server con los 3 estados (`undefined|[]|[...]`).
4. Crear `use-<rol>-<feature>.ts` (hook client) que fetchea via `apiFetch` y mapea snake→camel.
5. Crear `<feature>-data.tsx` (isla cliente) que consume el hook y delega.
6. `app/(private)/<rol>/<feature>/page.tsx`: server, solo maqueta header + isla cliente.
7. Si el backend no expone el endpoint, crear/extender el controller correspondiente y registrar la ruta en el grupo `role:` que corresponda.
8. Commit → `/sync` → agregar fila a la tabla "Módulos implementados" de esta nota + sección del endpoint en [[api-contracts]].

## Relacionado

[[arquitectura]] [[rbac]] [[api-contracts]] [[design-system]] [[stack]]

## Detalle por módulo
Esta sección crece con cada feature que se implementa. Cada subsección sigue el formato `### Módulo: <rol> / <feature>` con: carpeta, endpoint(s), estructura de archivos, convenciones específicas que aplicó y fecha. Cuando un módulo se deprecia, su subsección se marca pero no se borra (historia).

## Módulo: admin / dashboard
**Implementado:** 2026-05-13
**Carpeta:** `Frontend/components/custom/admin/dashboard/`
**Page:** `Frontend/app/(private)/admin/dashboard/page.tsx` (server, solo maqueta)
**Endpoint que consume:** `GET /api/admin/dashboard` ([[api-contracts]])
**Permiso:** `auth:sanctum + role:administrador`
**Scope:** global (sin filtro `sucursal_id` — admin ve todas las sucursales).

**Estructura de archivos:**
```
Frontend/components/custom/admin/dashboard/
├── dashboard-header.tsx          # título + fecha es-EC, server
├── stat-card.tsx                 # KPI atómico reutilizable, server
├── kpi-row.tsx                   # grid de 4 stat-cards, server
├── stock-critico-card.tsx        # tabla por sucursal, server
├── lotes-por-vencer-card.tsx     # lista con badge por severidad, server
├── pedidos-pendientes-card.tsx   # lista con estado pendiente|en_camino, server
├── auditoria-reciente-card.tsx   # timeline vertical de eventos, server
├── use-admin-dashboard.ts        # hook client: fetch + snake→camel
└── admin-dashboard-data.tsx      # isla cliente: consume hook + delega a cards
```

**Convenciones aplicadas (verifica el patrón):**
- Server-first: 7 componentes presentacionales, 1 isla cliente (`admin-dashboard-data.tsx`).
- Tres estados: cada sección renderea skeleton / empty / data según `items === undefined | [] | [...]`.
- Adapter snake→camel en `use-admin-dashboard.ts` boundary.
- Tipos co-localizados: `StockCriticoItem`, `LotePorVencerItem`, `PedidoPendiente`, `AuditoriaEvento`.
- Enums tomados del vault: `pedido.estado` ∈ `{pendiente, en_camino}` (no `preparando|listo` como una primera iteración asumió erróneamente).
- Page solo compone: `<DashboardHeader />` + `<AdminDashboardData />`.

**Notas de implementación:**
- Stock crítico se calcula a nivel medicamento × sucursal (no por lote) porque `stock_minimo` vive en [[medicamento]].
- Auditoría reciente lee últimos 8 de `movimientos_stock` con su actor (usuario, nullable) — la acción se deriva del enum `tipo` ([[movimiento-stock]]).
- Lotes por vencer: umbral 30 días, definido en [[lote]] (estado computado `proximo_a_vencer`).

## Módulo: admin / inventario
**Implementado:** 2026-05-13 (parcial — solo sub-página `lotes/`)
**Carpeta:** `Frontend/components/custom/admin/inventario/`
**Páginas planificadas:** overview (`/admin/inventario`), medicamentos (stock view), lotes ✅, kardex
**Permiso:** `auth:sanctum + role:administrador`
**Scope:** global (sin filtro `sucursal_id` — admin global).

**Endpoints consumidos:**
- `GET /api/admin/inventario/overview` (pendiente — fase 6)
- `GET /api/admin/inventario/medicamentos` (pendiente — fase 5)
- `GET /api/lotes` + `POST /api/lotes` + `PUT /api/lotes/{id}` (en uso desde fase 3)
- `GET /api/movimientos-stock` + `POST /api/movimientos-stock` (pendiente — fase 4)
- `GET /api/medicamentos`, `GET /api/sucursales`, `GET /api/proveedores`, `GET /api/categorias` (lookups del Sheet de alta)

**Estructura de archivos (extensión del patrón — sub-carpetas dentro del feature):**
```
Frontend/components/custom/admin/inventario/
├── _shared/                          # primitives reusados entre sub-páginas
│   ├── lote-estado-badge.tsx         # 3 estados computados (vigente/proximo/vencido)
│   └── use-lookups.ts                # precarga sucursales/proveedores/medicamentos/categorias
├── lotes/                            # → /admin/inventario/lotes
│   ├── use-admin-lotes.ts            # hook + createLote/updateLote (mutations)
│   ├── lotes-filters.tsx             # búsqueda libre, sucursal, estado, solo_con_stock
│   ├── lotes-table.tsx               # presentacional, server-friendly via island
│   ├── lote-alta-sheet.tsx           # Sheet con todos los campos del modelo
│   ├── lote-edit-sheet.tsx           # Sheet solo metadatos (numero_lote, fecha_venc, costo_unitario)
│   └── lotes-data.tsx                # isla cliente: orquesta filtros + tabla + sheets
├── medicamentos/                     # → pendiente
├── kardex/                           # → pendiente
└── overview/                         # → pendiente
```

Cuando un feature tiene más de una sub-página, las sub-carpetas (`_shared/`, `<sub>/`) son la evolución natural del patrón base `custom/<rol>/<feature>/`. Documentado acá para que próximos módulos con varias sub-páginas (POS, reportes, etc.) sigan la misma forma.

**Convenciones aplicadas (verifica el patrón global):**
- Server-first salvo islas necesarias por estado/forms.
- Tres estados de UI (skeleton / empty / data) en la tabla.
- Mutations co-localizadas con el hook del feature (`createLote`, `updateLote`).
- Forms con `react-hook-form` + `zod`. Patrón `useForm<FormInput, undefined, FormOutput>` cuando se usa `z.coerce.*` (necesario para que el resolver acepte input y output distintos).
- Toast feedback con `sonner` en cada mutation.
- Debounce de 300ms para la búsqueda libre.
- Lookups precargados una vez en la isla cliente (no por sheet/dropdown).
- Usuario actual se inyecta como `usuario_id` del lote para auditar el movimiento `ingreso` auto-generado.

## Mapping UI → backend (decisión temporal C1)

El backend mantiene los 7 tipos canónicos de [[movimiento-stock]]. La UI admin del módulo expone solo 4 para simplificar la operación del administrador en V1:

| Label UI | Tipo backend | Signo de cantidad | Notas |
|---|---|---|---|
| Entrada | `ingreso` | + | Auto-generado al crear lote desde `lote-alta-sheet`. También seleccionable en movimiento manual cuando se ajusta stock por compra adicional sin nuevo lote. |
| Salida | `perdida` | − | Default de "salida" no contemplada por venta o devolución. |
| Ajuste | `ajuste` | ± | Requiere justificación obligatoria por contrato del controller. |
| Vencimiento | `vencimiento` | − | Da de baja stock vencido. No automatizado por cron (decisión MVP). |

**Tipos no expuestos en UI**: `venta` y `devolucion_cliente` (auto-generados por VentaController y PedidoController, aparecen en kardex pero no son creables manualmente); `devolucion_proveedor` (accesible solo vía API directa hasta que se implemente la UI específica de devoluciones a proveedor — deuda técnica diferida).

## Decisiones temporales (deuda técnica diferida)

- **C1 — Enum reducido**: explicado arriba. Cuando entre el módulo POS / pedidos, los 7 tipos quedan automáticamente en kardex; este mapping reducido es solo para la UI de **alta manual**.
- **C2 — Catálogo vs Inventario/Medicamentos**: `/admin/catalogo` se mantiene como gestión comercial (precios, categorías, descripción, requiere_receta). `/admin/inventario/medicamentos` será la vista de stock agregado por medicamento × sucursal. Comparten modelo `Medicamento` pero no UI. Si la duplicación de navegación molesta a futuro, evaluar consolidar.
- **C3 — `ubicacion_fisica`**: queda en `medicamento` ([[medicamento]]) por ahora. **Recomendación futura**: moverlo a [[lote]] cuando un mismo medicamento empiece a almacenarse en lugares físicos distintos por lote (ej. por proximidad de vencimiento o por temperatura). Implica migration + cambios en form de alta de lote.
- **Cron de vencimiento automático**: no implementado en V1. El admin puede registrar manualmente un movimiento `vencimiento` para dar de baja stock cuyo lote venció. Stock "fantasma" (lote vencido con `cantidad_actual > 0`) se permite y se visualiza con el badge `vencido`.

## Limpieza pendiente para humano

La tabla "Módulos implementados" al inicio de esta nota debe actualizarse con la fila:

```
| admin | inventario | `custom/admin/inventario/` | varios ([[api-contracts]] sección Inventario Admin) | 🚧 parcial 2026-05-13 (lotes ✅; medicamentos/kardex/overview pendientes) |
```

Cuando se completen las 4 sub-páginas, marcar como ✅.

## Módulo: admin / inventario — kardex (2026-05-13)
**Implementado:** 2026-05-13
**Carpeta:** `Frontend/components/custom/admin/inventario/kardex/`
**Page:** `Frontend/app/(private)/admin/inventario/kardex/page.tsx`

**Endpoints consumidos:**
- `GET /api/movimientos-stock` con filtros tipo / sucursal_id / lote_id, paginado 50/pag
- `POST /api/movimientos-stock` (mutación: alta manual)
- `GET /api/lotes?medicamento_id=X&solo_con_stock=1` (lookup secundario para seleccionar lote del medicamento elegido)

**Estructura:**
```
kardex/
├── use-admin-kardex.ts            # hook + createMovimiento + fetchLotesDeMedicamento
├── kardex-filters.tsx             # filtros tipo (7 tipos canónicos) + sucursal
├── kardex-table.tsx               # tabla con badges por tipo, signo coloreado, distinción auto/manual
├── movimiento-alta-dialog.tsx     # Dialog 2-pasos (medicamento → lote) + RHF + Zod
└── kardex-data.tsx                # isla cliente que orquesta todo
```

**Diseño del Dialog de alta:**
- Flujo: elegís medicamento → se cargan dinámicamente sus lotes vigentes (`/api/lotes?medicamento_id=X&solo_con_stock=1`) → elegís lote → tipo UI → cantidad → justificación.
- El select de lotes muestra `numero_lote · stock N · vence YYYY-MM-DD` para facilitar la decisión.
- Justificación obligatoria (min 5 chars) en los 4 tipos UI, aunque el backend solo la exige para `ajuste` y `perdida`. Decisión por consistencia operativa del Kardex.
- Validación condicional: para `entrada / salida / vencimiento` la cantidad debe ser positiva (la inversión de signo la hace el handler antes de enviar). Para `ajuste` la cantidad es signed (el usuario indica si suma o resta).

**Diferencia visual auto vs manual:**
La columna "Actor" muestra `Sistema` (italic) si `usuario_id` viene null (movimiento auto-generado por VentaController, PedidoController o LoteController) y el nombre del usuario si fue manual. Permite auditoría rápida sin filtros extra.

## ERRATUM 2026-05-13 — mapping UI → backend del módulo inventario
**Supera al mapping descrito en la sección 'Módulo: admin / inventario' de este mismo archivo.**

El mapping correcto vigente (verificado contra `MovimientoStockController::store` que valida `tipo ∈ {ajuste, devolucion_cliente, devolucion_proveedor, vencimiento, perdida}`):

| Label UI | Tipo backend | Signo cantidad | Justif. UI |
|---|---|---|---|
| Entrada | `ajuste` | + (cantidad positiva) | sí, obligatoria |
| Salida | `perdida` | − (el handler niega la cantidad UI) | sí, obligatoria |
| Ajuste | `ajuste` | signed (el usuario indica) | sí, obligatoria |
| Vencimiento | `vencimiento` | − (el handler niega la cantidad UI) | sí, obligatoria |

**Por qué cambió respecto a la versión previa**: dije que 'Entrada' mapeaba a `ingreso`, pero `POST /api/movimientos-stock` rechaza `tipo=ingreso` explícitamente. El tipo `ingreso` queda reservado al auto-generado por `LoteController::store` para preservar trazabilidad de origen (proveedor). El flujo correcto para sumar stock por recepción de un nuevo lote es **"Nuevo lote"** en `/admin/inventario/lotes`. "Entrada" desde el Kardex es para sumar al stock de un lote **existente** sin tener un nuevo lote físico (corrección por encontrado, compra adicional al mismo lote, etc.) — y por eso va como `ajuste` con signo positivo.

**Tipos backend visibles en kardex pero NO creables desde la UI manual:**
- `ingreso` — auto-generado por `LoteController::store`.
- `venta` — auto-generado por `VentaController::store` y `PedidoController::cambiarEstado`.
- `devolucion_cliente` — auto-generado por `PedidoController::cambiarEstado` al cancelar pedido entregado.
- `devolucion_proveedor` — accesible solo vía API directa hasta que se implemente la UI específica (deuda diferida).

## Modulo admin / inventario - medicamentos (2026-05-13)
**Implementado:** 2026-05-13
**Carpeta:** `Frontend/components/custom/admin/inventario/medicamentos/`
**Page:** `Frontend/app/(private)/admin/inventario/medicamentos/page.tsx`

**Endpoint consumido:**
- `GET /api/admin/inventario/medicamentos` con filtros sucursal_id / categoria_id / q / solo_critico, paginado 25/pag.

**Estructura:**
```
medicamentos/
├── use-admin-medicamentos.ts      # hook con AbortController + filtros + paginación
├── medicamentos-filters.tsx       # búsqueda libre + sucursal + categoría + solo crítico
├── medicamentos-table.tsx         # tabla con highlight de stock crítico y badges de lotes
└── medicamentos-data.tsx          # isla cliente, debounce 300ms en búsqueda
```

**Comportamientos clave:**
- Stock crítico calculado server-side (`solo_critico=1` agrega `HAVING COALESCE(SUM(cantidad_actual vigentes), 0) < stock_minimo`) — el flag coincide con el conteo del KPI del overview.
- Cada fila muestra contadores de lotes (vigentes / por vencer / vencidos) usando badges con código de color para escaneo visual rápido.
- Búsqueda libre vía param `q` que el backend resuelve con `ilike` sobre nombre_comercial, principio_activo y codigo_barras.
- Es vista **solo lectura del inventario**. El CRUD del catálogo (precio, descripción, categoría, requiere_receta) vive en `/admin/catalogo` (decisión C2).

**Estado del modulo admin/inventario:** quedan pendientes solo overview (`/admin/inventario`) y la limpieza humana de la tabla 'Modulos implementados' al inicio de esta nota.

## Modulo admin / inventario - overview (2026-05-13) - cierre de iteracion 1
**Implementado:** 2026-05-13
**Carpeta:** `Frontend/components/custom/admin/inventario/overview/`
**Page:** `Frontend/app/(private)/admin/inventario/page.tsx`

**Endpoint consumido:**
- `GET /api/admin/inventario/overview` (kpis + stock_critico + lotes_por_vencer)

**Estructura:**
```
overview/
├── use-admin-inventario-overview.ts   # hook + adapter snake->camel
├── inventario-kpi-row.tsx             # 6 stat-cards reusando StatCard del dashboard
├── inventario-subnav.tsx              # 3 cards-link a sub-paginas
└── inventario-overview-data.tsx       # isla cliente
```

**Reuso entre modulos:**
- `StockCriticoCard` y `LotesPorVencerCard` del modulo `admin/dashboard/` se importan tal cual aca porque el shape del payload es identico. Esto valida el patron 'un endpoint por pagina + componentes presentacionales con shape canonico': cuando dos paginas comparten KPI o seccion, comparten componente sin adapter.
- `StatCard` tambien se reusa para los 6 KPIs de inventario.

## Estado final iteracion 1 del modulo admin/inventario

| Sub-pagina | Endpoint | Estado |
|---|---|---|
| `/admin/inventario` (overview) | `GET /api/admin/inventario/overview` | OK |
| `/admin/inventario/medicamentos` | `GET /api/admin/inventario/medicamentos` | OK |
| `/admin/inventario/lotes` | `GET /api/lotes`, `POST /api/lotes`, `PUT /api/lotes/{id}` | OK |
| `/admin/inventario/kardex` | `GET /api/movimientos-stock`, `POST /api/movimientos-stock` | OK |

**Decisiones temporales (deuda diferida) reiteradas:**
- C1 enum reducido: 4 labels UI mapean a tipos backend (ver erratum). `devolucion_proveedor` accesible solo via API.
- C2 catalogo y medicamentos coexisten: `/admin/catalogo` (CRUD comercial) y `/admin/inventario/medicamentos` (solo vista de stock).
- C3 `ubicacion_fisica` queda en medicamento. Recomendacion futura: mover a lote cuando haga falta diferenciar por lote.
- Sin cron de vencimiento automatico: admin registra manualmente movimiento `vencimiento` para dar de baja stock vencido.
- Tabla 'Modulos implementados' al inicio de esta nota necesita update humano agregando la fila de admin/inventario.

## Modulo admin / catalogo (2026-05-13)
**Implementado:** 2026-05-13
**Carpeta:** `Frontend/components/custom/admin/catalogo/`
**Page:** `Frontend/app/(private)/admin/catalogo/page.tsx`
**Permiso:** `auth:sanctum + role:administrador`

**Endpoints consumidos:**
- `GET /api/medicamentos` con filtros sucursal_id, categoria_id, q, solo_activos (default true)
- `POST /api/medicamentos`, `PUT /api/medicamentos/{id}`, `DELETE /api/medicamentos/{id}` (soft delete)

**Estructura:**
```
catalogo/
├── use-admin-catalogo.ts          # hook + createMedicamento/updateMedicamento/deleteMedicamento
├── catalogo-filters.tsx           # busqueda libre, sucursal, categoria, incluir inactivos
├── catalogo-table.tsx             # tabla con badges (receta, inactivo) + acciones edit/delete
├── medicamento-alta-sheet.tsx     # Sheet con TODOS los campos del modelo
├── medicamento-edit-sheet.tsx     # Sheet (sin sucursal_id por multi-tenancy)
└── catalogo-data.tsx              # isla cliente + AlertDialog para confirm delete
```

**Convenciones aplicadas:**
- Mismo patron de Lotes: Sheet para alta/edit, RHF + Zod con useForm<FormInput, undefined, FormOutput>, tres estados (skeleton/empty/data).
- Soft delete via AlertDialog (preserva historial de ventas pasadas — Medicamento usa SoftDeletes per `domain/medicamento.md`).
- Sucursal NO editable en el Sheet de edicion: cambiar sucursal de un medicamento existente implicaria reasignar lotes/ventas — operacion no soportada. Para mover, dar de baja y crear nuevo.
- Switch para `requiere_receta` y `activo` con descripcion inline del impacto.
- Codigo de barras opcional, unique por sucursal (validacion en backend).

**Relacion con admin/inventario/medicamentos:**
Catalogo es CRUD comercial (precio, categoria, descripcion, flags). Inventario/medicamentos es vista de stock (read-only). Comparten modelo `Medicamento`, no UI (decision C2 en seccion 'Modulo admin / inventario').

## Patron de carpetas admin/_shared/ (extension)

Este commit promueve `useInventarioLookups` (que vivia en `inventario/_shared/`) a `useAdminLookups` en `custom/admin/_shared/use-lookups.ts`. Ahora dos modulos lo consumen sin import cross-module:

```
custom/admin/
├── _shared/                       # NIVEL NUEVO — primitives compartidos entre modulos admin
│   └── use-lookups.ts             # sucursales, proveedores, medicamentos, categorias
├── dashboard/
├── inventario/
│   ├── _shared/                   # primitives especificos de inventario
│   │   └── lote-estado-badge.tsx  # solo aplica a Lote — se queda aca
│   ├── overview/
│   ├── medicamentos/
│   ├── lotes/
│   └── kardex/
└── catalogo/
```

**Regla del patron**:
- Si un primitive lo usan >=2 modulos al mismo nivel de rol → promover a `<rol>/_shared/`.
- Si es especifico de un modulo → queda en `<rol>/<feature>/_shared/`.
- Si es generico de toda la app → vive en `custom/` directo (theme-provider, page-placeholder, etc).

Futuros modulos admin (reportes, usuarios, auditoria) podran consumir `useAdminLookups` directamente sin redefinir el catalogo de selects.

## Modulos empleado - POS + ventas + dashboard + clientes + stock (commit c3bfaa3, 2026-05-16)
Primera tanda completa del arbol del rol empleado. Cinco features nuevos bajo `Frontend/components/custom/empleado/`. Estructura general (sigue el patron base + `_shared/` cuando un primitive se usa en >=2 features del rol):

```
Frontend/components/custom/empleado/
|-- _shared/
|   `-- use-empleado-lookups.ts        # categorias + proveedores + medicamentos (de su sucursal)
|-- pos/                                # /empleado/pos
|-- ventas/                             # /empleado/ventas (historial)
|-- dashboard/                          # /empleado/dashboard
|-- clientes/                           # /empleado/clientes
`-- stock/                              # /empleado/stock + 5 sub-paginas
    |-- overview/, inventario/, lotes/, kardex/, entradas/, devoluciones/
```

### Modulo empleado / pos
**Page:** `/empleado/pos`
**Endpoints:** `GET /api/pos/medicamentos`, `GET /api/pos/clientes`, `GET /api/farmacia` (lookup IVA), `POST /api/recetas` (multipart), `POST /api/ventas` ([[api-contracts]]).
**Permiso:** `auth:sanctum + role:administrador,empleado` (UI gated por `pos.sell` en [[rbac]]).

**Estructura:**
```
pos/
|-- use-pos.ts                          # estado del carrito + types + mutations (crearReceta, crearVenta)
|-- use-pos-search.ts                   # busqueda debounced (250ms) contra /pos/medicamentos
|-- use-pos-clientes.ts                 # autocomplete debounced
|-- pos-search.tsx                      # input + lista de resultados con stock badge
|-- pos-cart.tsx                        # tabla items + subtotal/IVA/total previsualizado
|-- pos-cliente-selector.tsx            # popover con autocomplete
|-- pos-receta-block.tsx                # form inline reactivo al carrito (aparece si algun item requiere_receta)
|-- pos-confirmar-dialog.tsx            # metodo pago + confirmar (bloquea si falta receta)
|-- pos-comprobante-dialog.tsx          # comprobante HTML imprimible (window.print + CSS print en [[design-system]])
`-- pos-data.tsx                        # isla cliente - orquesta todo
```

**Decisiones clave:**
- Receta **una sola por venta** (modelo del vault). El bloque `pos-receta-block.tsx` aparece/desaparece reactivo al carrito; cuando deja de ser requerida, `useResetRecetaSiNoEsRequerida` limpia `receta_id` para no arrastrar referencia huerfana a la siguiente venta.
- IVA snapshot: el frontend usa `iva_tasa` de `Farmacia` solo para previsualizar totales; los valores autoritativos vienen del backend en la `VentaResponse`.
- Selector de cliente sin descuento global (decision sprint). Descuento global queda para una tanda con autorizacion admin.
- `apiFetch` (`Frontend/lib/api.ts`) extendido para aceptar `FormData` (no setea `Content-Type` asi el browser pone el boundary correcto). Necesario para el upload opcional de receta.

### Modulo empleado / ventas (historial)
**Page:** `/empleado/ventas`
**Endpoints:** `GET /api/ventas` (filtrado por sucursal del user automaticamente en el backend), `GET /api/ventas/{id}`.

**Estructura:**
```
ventas/
|-- use-empleado-ventas.ts
|-- ventas-filters.tsx                  # desde, hasta, estado, metodo_pago
|-- ventas-table.tsx
|-- venta-detalle-dialog.tsx            # detalle con items, IVA snapshot, badge de estado
`-- ventas-data.tsx                     # isla + paginador
```

### Modulo empleado / dashboard
**Page:** `/empleado/dashboard`
**Endpoint:** `GET /api/empleado/dashboard`.

**Estructura:**
```
dashboard/
|-- use-empleado-dashboard.ts           # adapter snake->camel
|-- empleado-kpi-row.tsx                # 5 KPIs (ventas del dia, operaciones, stock critico, lotes por vencer, pedidos pendientes)
|-- ventas-recientes-card.tsx           # ventas de hoy en tu sucursal
`-- empleado-dashboard-data.tsx         # isla
```

**Reuso entre roles**: `StatCard`, `StockCriticoCard`, `LotesPorVencerCard` y `PedidosPendientesCard` se importan **tal cual** desde `custom/admin/dashboard/` porque el shape del payload es identico (la convencion del KPI shape canonico entre roles vale la pena mantener). Componente nuevo del empleado: `VentasRecientesCard`.

### Modulo empleado / clientes
**Page:** `/empleado/clientes`
**Endpoints:** `GET /api/empleado/clientes`, `GET /api/empleado/clientes/{id}`.

**Estructura:**
```
clientes/
|-- use-empleado-clientes.ts            # listado paginado + fetchClienteDetalle
|-- clientes-filters.tsx                # busqueda libre por nombre/email
|-- clientes-table.tsx                  # contadores de ventas/pedidos + accion 'Historial'
|-- cliente-historial-drawer.tsx        # Sheet derecho con secciones ventas (locales) + pedidos (globales)
`-- clientes-data.tsx                   # isla
```

**Privacidad:** `telefono` y `direccion` estan ocultos por contrato del endpoint (RNF-04 / [[cliente]]). El drawer muestra solo `{ ventas_de_mi_sucursal, pedidos_globales }`.

### Modulo empleado / stock (overview + 5 sub-paginas)
**Pages:**
- `/empleado/stock` (overview con subnav)
- `/empleado/stock/inventario` (lectura)
- `/empleado/stock/lotes` (CRUD local: alta = recepcion de proveedor)
- `/empleado/stock/kardex`
- `/empleado/stock/entradas`
- `/empleado/stock/devoluciones`

**Endpoints:** `GET /api/empleado/inventario/medicamentos`, `GET/POST /api/lotes` (con `sucursal_id` forzado del user), `PUT /api/lotes/{id}`, `GET/POST /api/movimientos-stock`.

**Estructura:**
```
stock/
|-- overview/
|   |-- stock-subnav.tsx                # 5 cards-link
|   `-- stock-overview-data.tsx         # reusa cards admin con datos de /empleado/dashboard
|-- inventario/                         # solo lectura
|   `-- use-stock-inventario.ts, inventario-filters/table/data.tsx
|-- lotes/
|   |-- use-stock-lotes.ts              # forza sucursal_id en buildQuery
|   |-- lote-alta-sheet.tsx             # sucursal_id desde useAuth, NO es campo del form
|   `-- lote-edit-sheet.tsx, lotes-filters/table/data.tsx
|-- kardex/
|   |-- use-stock-kardex.ts             # types canonicos co-localizados (no acopla a admin)
|   |-- kardex-filters/table/data.tsx
|   `-- movimiento-alta-dialog.tsx      # 4 tipos: devolucion_cliente, devolucion_proveedor, vencimiento, perdida (sin `ajuste`)
|-- entradas/
|   `-- entradas-data.tsx               # filtra tipo=ingreso + acceso al sheet de recibir lote
`-- devoluciones/
    `-- devoluciones-data.tsx           # radio para alternar devolucion_cliente / devolucion_proveedor
```

**Decisiones clave (alineadas a [[rbac]]):**
- **`ajuste` excluido del UI**: el dialog del empleado no ofrece esa opcion (admin-only por `stock.adjust`). La regla esta en el componente; el enforcement final lo hace el backend (deuda diferida: `MovimientoStockController` aun acepta `tipo=ajuste` con cualquier rol - flag mencionado al usuario, fuera del scope de este commit).
- **Stock empleado se duplica del admin**, no se reusa con flag de scope. Decision consciente del sprint: el modulo evoluciona distinto al de admin (sin ajuste, alta de lote infiriendo sucursal, sin filtro de sucursal). El unico primitive compartido es `LoteEstadoBadge` (puro CSS+enum).
- **`useEmpleadoLookups`** sigue el patron `<rol>/_shared/` ya establecido para admin: precarga categorias, proveedores y medicamentos (de su sucursal) una vez por isla.
- **`stock-overview-data` reusa `/empleado/dashboard`** en lugar de crear un `/empleado/inventario/overview` paralelo: los KPIs y listas que aplican ya estan en el dashboard endpoint.

## Modulos cliente + catalogo publico (commit b54bba4, 2026-05-16)
Cierre del rol cliente. Cuatro features bajo `Frontend/components/custom/cliente/` + un modulo publico `custom/public/catalogo/` para el invitado. Estructura:

```
Frontend/components/custom/
|-- cliente/
|   |-- catalogo/                       # /cliente/catalogo
|   |-- pedidos/                        # /cliente/pedidos + /cliente/pedidos/[id]
|   `-- dashboard/                      # /cliente/dashboard
`-- public/
    `-- catalogo/                       # /catalogo (invitado)
```

Decisiones que aplican al rol entero:
- **Carrito en localStorage** (key `farmedic.cliente.carrito`), no en BD. Persiste cross-sesion del mismo browser pero no cross-device. Decision MVP - aceptable por la naturaleza efimera del carrito y la baja friccion vs sync con backend.
- **Stock visible al cliente es global** (suma de sucursales activas vigentes). La sucursal especifica se elige en el checkout - alineado con `[[pedido]]` (`sucursal_id` del pedido es 'la que atiende').
- **Catalogo publico y cliente duplicados** (decision explicita del sprint). El publico usa `GET /api/medicamentos` (read-only sin stock); el cliente usa `GET /api/cliente/catalogo` (con stock_disponible agregado). Modulos independientes para no acoplar la vista invitado con la auth-dependent del cliente.
- **Receta inline reusa `crearReceta()` del POS empleado** (`@/components/custom/empleado/pos/use-pos`). Mismo contrato `POST /api/recetas` multipart, mismo shape de response. Evita duplicar la mutation.

### Modulo cliente / catalogo
**Pages:** `/cliente/catalogo`
**Endpoints:** `GET /api/cliente/catalogo`, `GET /api/categorias` (lookup), `GET /api/sucursales` (selector en checkout), `GET /api/farmacia` (iva), `POST /api/recetas` (multipart, opcional), `POST /api/pedidos` ([[api-contracts]]).
**Permiso:** `auth:sanctum` (UI gated por `orders.create` en [[rbac]]).

**Estructura:**
```
cliente/catalogo/
|-- use-catalogo.ts                     # hook + carrito (useCart con localStorage) + mutations (crearPedido) + lookups (sucursales, categorias, iva)
|-- catalogo-filters.tsx                # busqueda + categoria + sin receta
|-- catalogo-grid.tsx                   # grilla de cards
|-- cart-sheet.tsx                      # sheet derecho con items + totales + 'Confirmar pedido'
|-- receta-block.tsx                    # form inline reactivo si algun item requiere receta
|-- checkout-dialog.tsx                 # selector sucursal + tipo_entrega + direccion/telefono + receta + total
`-- catalogo-data.tsx                   # isla cliente - orquesta filtros + grilla + cart sheet + checkout
```

**Flujo:** explorar -> agregar (carrito persiste a localStorage) -> abrir Cart Sheet -> 'Confirmar pedido' -> Checkout Dialog (sucursal + entrega + receta si aplica) -> POST /pedidos -> redirect a `/cliente/pedidos/[id]`. Carrito se limpia tras exito.

### Modulo cliente / pedidos (lista + detalle)
**Pages:** `/cliente/pedidos`, `/cliente/pedidos/[id]`
**Endpoints:** `GET /api/pedidos` (filtrado por cliente_id=auth automaticamente), `GET /api/pedidos/{id}`.

**Estructura:**
```
cliente/pedidos/
|-- use-cliente-pedidos.ts              # listado paginado + fetchPedidoDetalle
|-- pedido-estado-badge.tsx             # badge reusable por estado (pendiente/en_camino/entregado/cancelado) con colores por severidad
|-- pedidos-data.tsx                    # lista con filtro de estado, cards clickeables, paginador
`-- pedido-detalle-data.tsx             # detalle con timeline (tracking visual de transicion de estados) + datos envio + items + totales
```

El timeline visualiza la secuencia `pendiente -> en_camino -> entregado` con dots coloreados; si esta `cancelado` agrega un evento extra al final con tono destructivo.

### Modulo cliente / dashboard
**Page:** `/cliente/dashboard`
**Endpoint:** `GET /api/cliente/dashboard`.

**Estructura:**
```
cliente/dashboard/
|-- use-cliente-dashboard.ts            # adapter snake->camel
|-- cliente-kpi-row.tsx                 # 4 KPIs (pendientes, en_camino, entregados, total_gastado)
|-- pedidos-recientes-card.tsx          # lista de pedidos recientes con link al detalle
`-- cliente-dashboard-data.tsx          # isla con KPIs + pedidos recientes + card CTA al catalogo
```

**Reuso entre roles:** `StatCard` del admin se importa tal cual (shape canonico). `PedidoEstadoBadge` se reusa entre dashboard y la lista de pedidos del propio cliente.

### Modulo public / catalogo (invitado)
**Page:** `/catalogo`
**Endpoint:** `GET /api/medicamentos` (publico, sin auth).

**Estructura:**
```
public/catalogo/
|-- use-catalogo-publico.ts             # hook simple sin carrito
`-- catalogo-publico-data.tsx           # grilla read-only + busqueda + CTA prominente 'Inicia sesion para comprar'
```

No se reusa con el cliente porque el shape del endpoint difiere (publico no devuelve `stock_disponible`) y el invitado no tiene carrito ni checkout. Cards muestran categoria/precio y un boton 'Comprar' que redirige a `/login` (alineado a [[rbac]]: el invitado puede leer el catalogo pero no crear pedidos).

### Deuda diferida (fuera de scope de este commit)

- `/cliente/perfil` sigue placeholder (permiso `profile.edit.own` documentado pero sin UI).
- El cliente no puede cancelar su propio pedido desde la UI - solo admin/empleado via `PATCH /pedidos/{id}/estado`. Posible iteracion futura: permitir al cliente cancelar en estado `pendiente` (antes de despacho).
- `GET /api/cliente/medicamentos/{id}/stock-por-sucursal` creado en backend pero no consumido en el checkout. Cuando se quiera validar stock en la sucursal elegida ANTES del POST (UX preventiva, mejor que esperar al 422), el endpoint ya esta listo.

## Cierre admin - sucursales+mapa, usuarios, reportes (commit 9af2edb, 2026-05-17)
Tres módulos admin nuevos que cierran las páginas que quedaban como placeholder. Adicionalmente, el link "Auditoría" en `aside-admin.tsx` queda comentado hasta tener implementación real (decisión del sprint).

### Módulo admin / sucursales (con mapa interactivo)
**Page:** `/admin/sucursales`
**Endpoints:** `GET /api/sucursales` (lectura pública), `POST/PUT/DELETE /api/sucursales` (admin-only), `GET /api/farmacia` (lookup farmacia_id para el alta).

**Estructura:**
```
custom/admin/sucursales/
|-- use-admin-sucursales.ts            # hook + mutations create/update/delete + fetchFarmacia
|-- sucursales-filters.tsx             # busqueda + ciudad + switch solo_activas
|-- sucursales-table.tsx               # tabla CRUD con badge Geo + estado + acciones edit/toggle
|-- sucursales-map.tsx                 # wrapper Leaflet (NO export default puro - usar dynamic con ssr:false)
|-- sucursal-form-sheet.tsx            # alta+edit unificado con pick-on-map embebido (mapa de 260px)
`-- sucursales-data.tsx                # isla con Tabs Tabla/Mapa + AlertDialog para toggle
```

**Decisiones clave:**
- **Leaflet + OpenStreetMap** vs Google Maps: open-source, sin API key, suficiente para markers + popups + tiles. Tile attribution OSM obligatoria por licencia.
- **Dynamic import con `ssr: false`** en `sucursales-data.tsx` y `sucursal-form-sheet.tsx`: Leaflet usa `window` al cargarse, rompe en SSR. Wrapper expuesto como `import { SucursalesMap }` (no default export) + `next/dynamic` con loading skeleton.
- **Workaround del icono default**: Leaflet por default referencia rutas relativas para sus PNGs de marker; en bundlers no resuelven. `fixDefaultIcon()` en `sucursales-map.tsx` registra URLs absolutas del CDN unpkg en el primer mount.
- **Pick-on-map**: el form de alta/edit incluye un mapa pequeño con `onPick` callback. Click en el mapa setea `latitud`/`longitud` con `toFixed(7)` (precisión consistente con la columna decimal).
- **FitBounds** automático cuando hay ≥2 markers (encuadre del mapa para que se vean todos). Single marker → zoom 13. Cero markers con coords → center Ecuador, zoom 7.
- **CSS de leaflet** importado dentro del componente (`import "leaflet/dist/leaflet.css"`), no en `globals.css`, para que solo se cargue cuando el módulo se monta.

### Módulo admin / usuarios (CRUD + cambiar rol)
**Page:** `/admin/usuarios`
**Endpoints:** `GET /api/usuarios` (admin-only), `POST/PUT/DELETE /api/usuarios`, `PATCH /api/usuarios/{id}/rol`, `GET /api/roles`.

**Estructura:**
```
custom/admin/usuarios/
|-- use-admin-usuarios.ts              # hook + mutations create/update/delete/cambiarRol
|-- rol-badge.tsx                      # badge coloreado por rol (admin/empleado/cliente)
|-- usuarios-filters.tsx               # busqueda + rol + sucursal + switch activos
|-- usuarios-table.tsx                 # tabla con acciones: cambiar-rol (escudo) / edit / toggle
|-- usuario-form-sheet.tsx             # alta+edit unificado (alta pide rol; edit oculta rol)
|-- cambiar-rol-dialog.tsx             # dialog dedicado con selector rol + sucursal condicional
`-- usuarios-data.tsx                  # isla con AlertDialog de toggle
```

**Decisiones clave:**
- **Cambio de rol vía dialog separado**, no via el form de edición. Motivo: cambiar rol tiene reglas distintas (último admin, sucursal obligatoria condicional) y vale la pena el affordance dedicado (ícono escudo en la tabla).
- **Form unificado para alta y edit**: el sheet usa dos forms internos (`altaSchema` vs `editSchema`) que se ramifican según `isEdit`. El field `password` es obligatorio en alta y opcional en edit.
- **Sucursal condicional en alta**: solo aparece si el rol seleccionado es `administrador` o `empleado` (matchea regla del backend).
- **Reuso de `useAdminLookups`** del `_shared/` admin para sucursales en filters y dialog.

### Módulo admin / reportes
**Page:** `/admin/reportes`
**Endpoints:** `GET /api/admin/reportes/mensual` (JSON preview), `GET /api/admin/reportes/mensual.pdf` (descarga).

**Estructura:**
```
custom/admin/reportes/
|-- use-admin-reportes.ts              # hook fetch JSON + helper descargarReportePdf (blob+Bearer)
`-- reportes-data.tsx                  # selector año/mes + preview con 3 cards + boton descargar
```

**Decisiones clave:**
- **Descarga PDF con Bearer token via blob**: `window.open` no permite headers personalizados, así que el helper hace `fetch` con `Authorization` + `Accept: application/pdf`, obtiene blob, crea `URL.createObjectURL`, dispara `<a download>` programático y libera el objectURL. Patrón canónico para descargas autenticadas en SPAs.
- **Selector año/mes con `Select` shadcn**: 6 años hacia atrás + actual, 12 meses fijos en español. Simple, evita date-picker overkill.
- **Preview con cards** mostrando totalizado (KPIs en grid), tabla por sucursal, lista de stock crítico agrupada y tabla kardex totalizado. Misma data que el PDF — preview reasegura al admin antes de descargar.

### Ocultar Auditoría en aside-admin

`components/layout/aside-admin.tsx`: la entrada `{ href: "/admin/auditoria", label: "Auditoría" }` queda comentada en lugar de borrada. La página `/admin/auditoria/page.tsx` se conserva como placeholder. Reactivar es solo descomentar la línea cuando se implemente el módulo (parte del Kardex + log de operaciones admin).

## Modulo empleado / pedidos (commit 12021d6, 2026-05-17)
Cierra la UI faltante de `PedidoController@cambiarEstado` para el rol empleado. Listado de pedidos online con filtro por estado y detalle con cambio de estado controlado por AlertDialog.

**Pages:**
- `/empleado/pedidos` (listado, filtra por estado, default `pendiente`)
- `/empleado/pedidos/[id]` (detalle + acciones de transicion)

**Endpoints consumidos:**
- `GET /api/pedidos?estado=&page=&per_page=` (PedidoController@index — para admin/empleado devuelve todos los pedidos, sin filtrar por sucursal)
- `GET /api/pedidos/{id}` (PedidoController@show)
- `PATCH /api/pedidos/{id}/estado` (PedidoController@cambiarEstado — el empleado solo puede transicionar pedidos de su propia sucursal; 403 en backend si la sucursal no coincide)

**Permiso:** `auth:sanctum + role:administrador,empleado`. UI gated por `orders.read.all` + `orders.manage` ([[rbac]]).

**Estructura:**
```
custom/empleado/pedidos/
|-- use-empleado-pedidos.ts             # hook listado paginado + fetchPedidoDetalle + cambiarEstadoPedido + helper transicionesValidas
|-- pedido-estado-badge.tsx             # badge por estado (replicado, no se acopla al modulo cliente)
|-- pedidos-filters.tsx                 # filtro Select por estado (con opcion 'Todos')
|-- pedidos-table.tsx                   # tabla con N, cliente, sucursal, entrega, fecha, estado, total, accion 'Gestionar'
|-- pedidos-data.tsx                    # isla cliente: orquesta filtros + tabla + paginador, default filters.estado=pendiente
`-- pedido-detalle-data.tsx             # detalle + acciones de transicion + AlertDialog de confirmacion
```

**Decisiones clave:**
- **Transiciones validas co-localizadas**: el helper `transicionesValidas(estado)` en `use-empleado-pedidos.ts` replica la matriz del backend (`pendiente -> en_camino|cancelado`, `en_camino -> entregado|cancelado`, `entregado -> cancelado`, `cancelado -> []`). Es UX: el backend sigue siendo la autoridad y devuelve 409 ante una transicion invalida.
- **AlertDialog con copy especifico por destino**: cuatro pares `title/description/action` distintos. La descripcion para `entregado` avisa que se descuenta stock; la de `cancelado` avisa que si el pedido ya estaba entregado se genera una devolucion que reintegra stock. Reemplaza un primer iter con `window.confirm`.
- **Boton destructive solo en cancelado**: el `AlertDialogAction` recibe `bg-destructive` cuando `confirming === 'cancelado'`. El resto de transiciones usa el variant default.
- **Sucursal ajena visible pero no gestionable**: el endpoint `GET /api/pedidos` devuelve todos los pedidos al empleado (no filtra por sucursal), pero `PATCH .../estado` rechaza con 403 si no es de su sucursal. El detalle compara `pedido.sucursal_id !== user.sucursal_id` (via `useAuth`) y muestra Alert informativa + oculta los botones de transicion (evita el 403 reactivo y comunica el motivo).
- **`pedido-estado-badge.tsx` replicado**: existe un componente identico en `cliente/pedidos/`. Se decide replicar en lugar de promover a `_shared/` para no acoplar arboles de rol distintos (mismo criterio que se aplico con stock empleado vs admin). Si en el futuro aparece un tercer consumidor, se evalua promocion.
- **Default filtro = `pendiente`**: el caso operativo principal es procesar pendientes. El usuario puede elegir 'Todos' u otro estado explicitamente.
- **Listado en orden DESC**: la pagina muestra los pedidos mas recientes primero (alineado a `PedidoController@index` que ordena `orderByDesc('fecha_solicitud')`). Ver ERRATUM en [[pedido]].

**Nav:** `aside-empleado.tsx` agrega `{ href: '/empleado/pedidos', label: 'Pedidos', matchPrefix: '/empleado/pedidos' }` entre Ventas y Stock.

## Modulos perfil - admin/empleado/cliente + dispatcher (commit fd5a11a, 2026-05-17)
Cierra la pestana Perfil para los 3 roles. Cada rol tiene su propia pagina bajo su chrome (`/admin/perfil`, `/empleado/perfil`, `/cliente/perfil`) + un dispatcher fino en `/perfil` que redirige al `<rol>/perfil` correspondiente. La regla del [[rbac]] de no cross-link entre arboles de rol se respeta: cada rol vive en su prefijo, el dispatcher solo decide a cual entrar.

### Estructura

```
Frontend/components/custom/
|-- perfil/                              # cross-rol, primitives presentacionales puras
|   `-- _shared/
|       |-- use-self-profile.ts          # mutations updateProfile + updatePassword + hydrate user
|       |-- identity-section.tsx         # form nombre/email-readonly/telefono + direccion opcional via prop
|       |-- password-section.tsx         # form cambio password con validacion inline
|       `-- oauth-section.tsx            # badge Google conectada/no conectada
|-- admin/perfil/
|   |-- account-card.tsx                 # rol + alcance 'toda la cadena' + sucursal base + miembro desde
|   `-- perfil-data.tsx                  # isla cliente
|-- empleado/perfil/
|   |-- account-card.tsx                 # rol + alcance 'tu sucursal' + miembro desde
|   |-- sucursal-card.tsx                # detalle de la sucursal asignada (nombre, ciudad, direccion, telefono)
|   `-- perfil-data.tsx                  # isla cliente
`-- cliente/perfil/
    |-- account-card.tsx                 # rol + 'sos parte desde'
    |-- entrega-tip-card.tsx             # explica como se usan telefono/direccion en checkout
    `-- perfil-data.tsx                  # isla cliente, IdentitySection con withDireccion

Frontend/app/(private)/
|-- perfil/page.tsx                      # dispatcher 'use client' - redirige a <rol>/perfil
|-- admin/perfil/page.tsx                # server
|-- empleado/perfil/page.tsx             # server
`-- cliente/perfil/page.tsx              # server
```

### Endpoints consumidos
- `PUT /api/auth/me` ([[api-contracts]]) - whitelist por rol.
- `POST /api/auth/me/password` ([[api-contracts]]) - cambio de contrasenia.

Ninguno requiere fetch inicial: los datos del perfil vienen de `useAuth().user`, ya cargado al login. El hook `useSelfProfile` solo expone las mutations y delega a `AuthContext.setUser` para refrescar el user persistido tras un PUT exitoso.

### Decisiones clave (independencia y no-ifs)
- **Composicion en lugar de condicional por rol**: cada `perfil-data.tsx` arma su propia composicion de cards. No hay un solo `PerfilData` con `if (isCliente)`. Trade-off: leve duplicacion en el orquestador; beneficio: cero acoplamiento entre arboles de rol y libertad para evolucionar cada perfil distinto.
- **`IdentitySection` con `withDireccion: boolean`**: la unica variacion del form de datos personales es la presencia del campo direccion. Se modela como prop opcional, no como dos componentes ni un if dentro. Admin/empleado lo llaman sin la prop; cliente lo llama con `withDireccion`.
- **`AuthContext.setUser(next)` nuevo**: el contexto expone una manera de reemplazar el user persistido sin tocar el token. Antes solo existia `login(token, user)` (full replace) y `logout()`. `useSelfProfile` invoca `setUser(updated)` tras la respuesta del PUT para que el resto de la UI vea los datos nuevos sin re-fetch ni invalidacion de cache.
- **Type extension en `User`**: la interface en `hooks/use-auth.tsx` ahora incluye `telefono`, `direccion`, `google_oauth_id`, `created_at`. El backend ya los devolvia en `auth/me`, solo faltaba tiparlos.
- **Dispatcher en `/perfil`**: lo dejamos como punto de entrada estable. El aside del cliente apunta a `/cliente/perfil` directo (ya lo hacia antes); los asides admin/empleado siguen apuntando a `/perfil` y el dispatcher resuelve. Asi, si se agregan roles, no hay que actualizar N asides; el dispatcher lee `ROLE_URL_PREFIX` de [[rbac]].

### Reuso entre roles
- `IdentitySection` y `PasswordSection`: usados por los 3 perfiles sin adaptador.
- `OAuthSection`: usado por los 3 perfiles. Cuando se sumen mas providers, se extiende aca sin cambiar callers.
- `AccountCard` NO se reusa: cada rol arma la suya con su badge de rol, su descripcion de alcance, y sus campos relevantes. Mantener cards rol-especificas evita props condicionales (`alcanceLabel`, `mostrarSucursal`, etc.) que rapidamente se vuelven dificiles de leer.

### Aside links
- `aside-admin.tsx` y `aside-empleado.tsx`: ya tenian `Link href='/perfil'` en el footer. Se mantiene (dispatcher resuelve).
- `aside-cliente.tsx`: ya tenia `Link href='/cliente/perfil'` directo (estaba antes de este sprint). Se mantiene.

## Cierre RF-06/RF-08/RF-13 - descuento POS + descarga PDF venta + card top productos (commit 01caa90, 2026-05-17)
Tres extensiones a modulos existentes para cerrar RF que quedaban parciales. Sin modulos nuevos.

### empleado / pos — descuento por linea + descarga PDF

**Archivos tocados:**
- `use-pos.ts`: `CartItem.descuento: number` agregado; helper `setDescuento(id, monto)` en `usePosCart` con clamp a `[0, precio*cantidad]`. `calcularTotales()` ahora retorna `{ bruto, descuentos, subtotal, impuesto, total }` (subtotal = max(0, bruto - descuentos)). `VentaCreateInput.items[].descuento_item` opcional. Helper nuevo `descargarComprobantePdf(ventaId, numeroComprobante)` (mismo patron blob+Bearer de `descargarReportePdf`).
- `pos-cart.tsx`: nuevo prop `onSetDescuento`. Por cada linea, un toggle "Agregar descuento" expone un input USD; si el descuento es > 0 muestra el precio bruto tachado encima del neto. Estado local `editandoDescuento` para colapsar el input cuando el valor vuelve a 0 (UX). Fila adicional "Bruto / Descuentos" en el bloque de totales si hay descuentos activos.
- `pos-confirmar-dialog.tsx`: muestra desglose bruto/descuento si aplica, y al confirmar incluye `descuento_item` solo cuando es `> 0` (no manda `0` ni `undefined`).
- `pos-comprobante-dialog.tsx`: agrega boton "Descargar PDF" junto a "Imprimir". El comentario de cabecera que decia "placeholder de RF-08" fue actualizado para reflejar que ahora hay generacion server-side. `window.print()` se mantiene como atajo de impresion directa.
- `pos-data.tsx`: pasa `onSetDescuento={cart.setDescuento}` al `PosCart`.

**Decisiones clave:**
- **Descuento absoluto en USD, no porcentaje**: el modelo de [[venta-item]] guarda `descuento_item decimal(10,2)` absoluto. La UI mantiene esa convencion para alinear con el backend; convertir a/desde porcentaje a futuro es un wrapper en el componente.
- **Clamp en el setter del hook, no en el render**: `usePosCart.setDescuento` aplica `Math.max(0, Math.min(descuento, precio*cantidad))` antes de actualizar el estado. Tambien recalcula el clamp cuando cambia la cantidad (un descuento de $10 sobre cantidad=2 deberia bajar si la cantidad baja a 1).
- **UI colapsable**: el input solo aparece si el usuario lo abre o si ya hay descuento > 0. Mantiene el carrito limpio en el caso comun (sin descuento) sin ocultar el feature.
- **Sin gate de autorizacion admin**: el descuento por linea no requiere override admin en V1. La autorizacion del RF-06 esta documentada para `descuento_total` (global), no para el item-level; el item-level es ajuste fino normal del empleado.

### empleado / ventas — descarga PDF desde historial

**Archivos tocados:**
- `venta-detalle-dialog.tsx`: importa `descargarComprobantePdf` del modulo POS, agrega estado `descargando` y `DialogFooter` con boton "Descargar PDF".

**Reuso:** el helper de descarga vive en `empleado/pos/use-pos.ts` y se importa cross-feature. Es un caso valido del patron de reuso (`pos-data` y `venta-detalle-dialog` apuntan al mismo endpoint, no tiene sentido duplicar el helper). Si en el futuro este helper crece, puede promoverse a `empleado/_shared/`.

### admin / reportes — card top productos

**Archivos tocados:**
- `use-admin-reportes.ts`: tipo `ReporteMensual` extendido con `top_productos: Array<{ medicamento_id, nombre_comercial, principio_activo, unidades, monto, ventas_distintas }>`.
- `reportes-data.tsx`: nueva card "Productos mas vendidos" con tabla (rank, medicamento + principio activo, unidades, ventas, monto) usando `USD` y `asNum` ya disponibles. Icon `TrendingUp` de lucide-react. Tres estados: empty si no hay ventas; tabla con data si las hay.

**Reuso con el PDF**: la misma data alimenta el preview frontend y la tabla del PDF (`reportes/mensual.blade.php` extendido con seccion equivalente). Patron consistente con las otras secciones del reporte (totalizado, por sucursal, stock critico, kardex).

## admin / perfil - configuracion del sistema (commit dea34d8, 2026-05-17)
Cierra el ultimo gap del Modulo 5 (Administracion). En lugar de crear una pagina dedicada `/admin/configuracion`, la configuracion global del sistema se integra como una seccion mas dentro del perfil del administrador. Decision pragmatica: el perfil ya es el espacio natural de 'cosas que un admin gestiona sobre su cuenta y el sistema' y agregar otra entrada en el nav-bar para una sola card era ruido.

### Archivos nuevos

```
custom/admin/perfil/
|-- use-farmacia-config.ts             # hook: fetch GET /api/farmacia + mutation PUT /api/farmacia/{id}
`-- farmacia-config-section.tsx        # seccion presentacional, form de 5 campos
```

### Archivos modificados

- `admin/perfil/perfil-data.tsx`: agrega `<FarmaciaConfigSection />` despues de la seccion de password, dentro de la columna principal (lg:col-span-2). Empleado y cliente NO ven esta seccion (sus `perfil-data` no la importan); enforcement real lo hace el backend con `role:administrador` en `PUT /api/farmacia/{id}`.

### Endpoint consumido

- `GET /api/farmacia` (publico — para leer la config actual y resolver el `id` para el PUT).
- `PUT /api/farmacia/{id}` (admin-only) — ya documentado en [[api-contracts]]. Whitelist: nombre, ruc, iva_tasa, telefono_contacto, email_contacto. logo_url queda fuera de scope (requiere upload, deuda).

### Decisiones clave

- **El IVA NO se migra a una tabla `configuracion`**. La nota [[farmacia]] (stable) ya establece que en el MVP hay una sola Farmacia, asi que el campo `farmacias.iva_tasa` es de facto global. Mover el campo seria una migration sin valor real y rompe el contrato del vault. La UI presenta esto como 'Configuracion del sistema' (no 'Farmacia X'), sin exponer el concepto multi-farmacia.
- **No hay nav-link**. La configuracion vive bajo `Mi perfil` (admin). Si en el futuro la config crece y necesita su propia pagina, se separa entonces; por ahora la regla 'YAGNI'.
- **Form patron consistente con IdentitySection/PasswordSection**: form local con valores iniciales hidratados desde el state del hook via `useEffect`, boton de guardar disabled cuando no hay cambios (`dirty`), validacion inline minima (IVA 0-100), toast feedback delegado al hook.
- **TS narrowing**: el hook expone `state` como discriminated union `{ loading | ready | error }`. La seccion hace 3 early-returns sucesivos (error → loading → !values) en lugar de uno combinado para que TypeScript narrow correctamente `state.status === 'ready'` y capturar `state.data` en una variable antes del closure del onSubmit (TS pierde narrowing dentro de funciones async dentro del componente).

### Cobertura RF

Con esto el **Modulo 5 (Administracion y Reportes)** queda completo. La caracteristica 'Configuracion general del sistema (datos de la farmacia, impuestos, etc.)' de la matriz de modulos esta cubierta. Todos los modulos declarados del PDF de requisitos estan implementados y mapeados a codigo.
