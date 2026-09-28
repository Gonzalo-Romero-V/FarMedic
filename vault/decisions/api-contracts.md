---
status: stable
code_path: Backend/routes/api.php
---

# API Contracts — Reference completa

**Qué**: Contrato de cada endpoint REST del backend FarMedic.
**Por qué**: Coherencia entre lo que el backend ofrece y lo que el frontend consume.

## Convenciones globales

| Aspecto | Valor |
|---------|-------|
| Base URL (dev) | `http://localhost:8000/api` |
| Auth header | `Authorization: Bearer <token>` |
| Accept | `application/json` |

---

## 🔑 Auth — Implementado ✅

### `GET /api/auth/login` (Named: `login`)
**Auth:** público
**Propósito:** Evitar errores de redirección del middleware `auth`. Devuelve 401 si se accede vía browser.

### `POST /api/auth/register/cliente` — registro público
**Request:** `{ nombre, email, password, telefono?, direccion? }`
**Response 201:** `{ user, token }`

### `POST /api/auth/login` — login tradicional
**Request:** `{ email, password }`
**Response 200:** `{ user, token }`

### `GET /auth/google/redirect` — inicio OAuth (web.php)
**Response:** 302 → Google

### `GET /auth/google/callback` — callback OAuth (web.php)
**Response:** 302 → `${FRONTEND_URL}/auth/callback?token=...`

### `POST /api/auth/logout` — invalidar token
**Auth:** Bearer
**Response:** 204

### `GET /api/auth/me` o `GET /api/user` — perfil actual
**Auth:** Bearer
**Response:** Usuario con `rol` y `sucursal`

---

## Matriz de protección efectiva — actualizado 2026-05-11

| Endpoint | Método | Protección |
|----------|--------|-----------|
| `/api/auth/login` | GET/POST | público |
| `/api/auth/register/cliente` | POST | público |
| `/api/auth/logout` | POST | auth:sanctum |
| `/api/auth/me` | GET | auth:sanctum |
| `/auth/google/*` | GET | público |

(Resto de tablas se mantienen igual según el modelo de datos...)

## Admin Dashboard (agregado) — Implementado 2026-05-13
Endpoint agregador para el dashboard admin. Sirve los datos de las 4 secciones + 4 KPIs en un solo round-trip para evitar N fetches desde el frontend.

### `GET /api/admin/dashboard`
**Auth:** `auth:sanctum` + `role:administrador`
**Scope:** global (sin filtro de sucursal_id — admin ve todas las sucursales).
**Implementación:** `Backend/app/Http/Controllers/Api/DashboardController.php::admin()`

**Response 200:**
```json
{
  "kpis": {
    "ventas_del_dia": number,             // sum(venta.total) where DATE(fecha)=hoy AND estado='completada'
    "stock_critico_count": integer,       // medicamentos cuya SUM(lote.cantidad_actual) < stock_minimo
    "lotes_por_vencer_count": integer,    // lotes con fecha_vencimiento entre hoy y hoy+30d
    "pedidos_pendientes_count": integer   // pedidos en estado pendiente o en_camino
  },
  "stock_critico": [{ id, sucursal, medicamento, stock_actual, stock_minimo }],
  "lotes_por_vencer": [{ id, codigo_lote, medicamento, sucursal, vencimiento, dias_restantes }],
  "pedidos_pendientes": [{ id, codigo, cliente, fecha, total, estado }],   // estado ∈ {pendiente, en_camino}
  "auditoria_reciente": [{ id, actor, accion, entidad, fecha }]            // desde movimientos_stock (Kardex)
}
```

**Reglas del payload (alineadas al vault):**
- `ventas_del_dia` usa enum [[venta]] `estado='completada'` (descarta anuladas).
- `pedidos_pendientes` usa enum [[pedido]] `pendiente|en_camino` (no `entregado` ni `cancelado`).
- `stock_critico` agrega por medicamento × sucursal porque `stock_minimo` vive en [[medicamento]], no en [[lote]].
- `lotes_por_vencer` usa umbral de 30 días definido en [[lote]] (estado computado `proximo_a_vencer`).
- `auditoria_reciente` lee últimos N [[movimiento-stock]] con su actor (usuario, nullable) y la acción derivada del enum `tipo`.
- Cada lista limita a 8 filas (constante `LIST_LIMIT` en el controller).

**Frontend que lo consume:** `Frontend/components/custom/admin/dashboard/use-admin-dashboard.ts` (mapea snake_case → camelCase en el boundary). UI en `Frontend/components/custom/admin/dashboard/*.tsx`.

## Inventario Admin (agregado) — Implementado 2026-05-13
Endpoints para el módulo Inventario y Stock del admin. Patrón un-round-trip-por-página que estableció [[frontend-modules]]: cada página tiene su endpoint agregado para evitar N fetches desde el frontend.

### `GET /api/admin/inventario/overview`
**Auth:** `auth:sanctum` + `role:administrador`
**Scope:** global (sin filtro de sucursal_id — multi-tenancy admin = global).
**Implementación:** `Backend/app/Http/Controllers/Api/InventarioController.php::overview()`

**Response 200:**
```json
{
  "kpis": {
    "total_medicamentos": int,            // medicamentos activos no soft-deleted
    "total_lotes_activos": int,           // lotes con cantidad_actual>0 y fecha_vencimiento>=hoy
    "stock_critico_count": int,           // SUM(lote.cantidad_actual vigentes) < medicamento.stock_minimo
    "lotes_por_vencer_count": int,        // fecha_vencimiento entre hoy y hoy+30d con stock
    "lotes_vencidos_count": int,          // fecha_vencimiento<hoy con cantidad_actual>0 (stock fantasma)
    "valor_inventario_usd": number|null   // SUM(cantidad_actual*costo_unitario) lotes vigentes — null si total=0
  },
  "stock_critico": [{ id, sucursal, medicamento, stock_actual, stock_minimo }],
  "lotes_por_vencer": [{ id, codigo_lote, medicamento, sucursal, vencimiento, dias_restantes }]
}
```

**Reglas:**
- Shape de `stock_critico` y `lotes_por_vencer` idéntico al de `GET /api/admin/dashboard` (los componentes presentacionales del frontend son reutilizables sin adapter).
- `valor_inventario_usd` es `null` cuando el total agregado da 0 — el frontend puede ocultar el KPI.
- Listas limitadas a `LIST_LIMIT=8` filas; umbral próximo a vencer `VENCIMIENTO_THRESHOLD_DAYS=30` ([[lote]]).

### `GET /api/admin/inventario/medicamentos`
**Auth:** `auth:sanctum` + `role:administrador`
**Scope:** global.
**Implementación:** `Backend/app/Http/Controllers/Api/InventarioController.php::medicamentos()`

**Query params (todos opcionales):**
- `sucursal_id` — filtra por sucursal del medicamento
- `categoria_id` — filtra por categoría
- `solo_critico` — solo medicamentos con stock < stock_minimo
- `q` — búsqueda libre por nombre_comercial / principio_activo / codigo_barras (ilike)
- `per_page` — default 25

**Response 200:** paginador Laravel estándar (`data`, `current_page`, `last_page`, `total`...). Cada item:
```json
{
  "id": int,
  "nombre_comercial": string,
  "principio_activo": string,
  "stock_minimo": int,
  "requiere_receta": bool,
  "precio": number,
  "sucursal_id": int, "sucursal_nombre": string,
  "categoria_id": int, "categoria_nombre": string,
  "stock_actual": int,                // SUM(cantidad_actual) lotes vigentes
  "lotes_vigentes_count": int,
  "lotes_por_vencer_count": int,      // próximos 30d
  "lotes_vencidos_count": int         // con stock fantasma
}
```

### Extensión de `GET /api/lotes` (commit 9f81654)
Eager-load extendido a `medicamento.categoria`, `sucursal`, `proveedor` (sin N+1). Nuevos query params: `proveedor_id`, `q` (búsqueda libre por número de lote / nombre / principio). Filtros previos (`sucursal_id`, `medicamento_id`, `estado`, `solo_con_stock`, `per_page`) intactos.

### Decisiones temporales documentadas
- **Enum de movimiento_stock UI vs backend**: backend mantiene los 7 tipos canónicos ([[movimiento-stock]]); la UI admin (al implementarse) expone solo 4 (Entrada/Salida/Ajuste/Vencimiento). Mapping en [[frontend-modules]] sección del módulo cuando se appendee.
- **`devolucion_proveedor`** queda accesible solo vía API directa hasta que la UI lo soporte explícitamente.

## POS y empleado - endpoints agregados (commit c3bfaa3, 2026-05-16)
Nuevos controllers `PosController` y `EmpleadoController`. Ambos viven en `auth:sanctum + role:administrador,empleado`. Patron estandar: el backend resuelve `sucursal_id` desde `auth()->user()` (nunca del body).

### POS - busqueda liviana

#### `GET /api/pos/medicamentos?q=`
**Implementacion:** `Backend/app/Http/Controllers/Api/PosController.php::medicamentos()`
**Scope:** sucursal del user.
**Response 200:** array directo (sin paginar, LIMIT 20). Solo medicamentos con `stock_actual > 0` (suma de lotes vigentes):
```json
[{ "id", "nombre_comercial", "principio_activo", "codigo_barras", "precio": number, "requiere_receta": bool, "stock_actual": int }]
```

#### `GET /api/pos/clientes?q=`
**Implementacion:** `PosController::clientes()`
**Scope:** global (clientes no tienen `sucursal_id` - domain/cliente.md).
**Response 200:** array de `{ id, nombre, email }`. NO devuelve `telefono`/`direccion` por RNF-04 ([[cliente]]).

### Empleado - agregados scope-local

#### `GET /api/empleado/dashboard`
**Implementacion:** `EmpleadoController::dashboard()`
**Scope:** sucursal del user.
**Response 200:** `{ kpis, stock_critico, lotes_por_vencer, ventas_recientes, pedidos_pendientes }`. KPIs: `ventas_del_dia`, `ventas_count_dia`, `stock_critico_count`, `lotes_por_vencer_count`, `pedidos_pendientes_count`. Shape de `stock_critico` / `lotes_por_vencer` identico al admin para reuso de componentes presentacionales.

#### `GET /api/empleado/inventario/medicamentos`
**Implementacion:** `EmpleadoController::inventarioMedicamentos()`
**Scope:** sucursal del user (no acepta `sucursal_id` opcional).
**Query params:** `categoria_id`, `solo_critico`, `q`, `per_page` (default 25).
**Response 200:** paginador Laravel. Cada item suma campos del catalogo (`nombre_comercial`, `principio_activo`, `codigo_barras`, `stock_minimo`, `ubicacion_fisica`, `requiere_receta`, `precio`, `categoria_*`) + `stock_actual`, `lotes_vigentes_count`, `lotes_por_vencer_count`. Sin `lotes_vencidos_count` (no aplica al vendedor en lectura).

#### `GET /api/empleado/clientes?q=&per_page=25`
**Implementacion:** `EmpleadoController::clientes()`
**Scope:** global, filtra `rol=cliente`.
**Response 200:** paginador. Cada item `{ id, nombre, email, created_at, ventas_count, pedidos_count }`. Sin `telefono`/`direccion` (RNF-04).

#### `GET /api/empleado/clientes/{id}`
**Implementacion:** `EmpleadoController::clienteDetalle()`
**Scope:** ventas filtradas por su sucursal, pedidos globales (cross-sucursal por canal online).
**Response 200:** `{ cliente, ventas[20 ultimas], pedidos[20 ultimos] }`.

### Refactor POST /api/ventas (VentaController)

Cambios respecto a la version previa:
- **`sucursal_id` y `usuario_id` ya no se aceptan del body** - se toman de `auth()->user()`. Refuerza que el empleado solo pueda vender en su propia sucursal y atribuir la venta a si mismo (defensa real, no solo UI).
- **`numero_comprobante`** ahora es serial autoincremental por sucursal con `lockForUpdate` dentro de la transaccion. Formato `'0000001'` zero-padded a 7 digitos. Alinea con el invariante de [[venta]] ("Serial autoincremental por sucursal"). El unique index `(sucursal_id, numero_comprobante)` sigue siendo el backstop.
- **`descuento_total`** se fija en `0` (descuento global queda diferido hasta tener autorizacion admin - RF-06).
- Validaciones: si `cliente_id` viene, debe ser usuario con `rol=cliente`. Si `medicamento.sucursal_id != user.sucursal_id`, 422.
- `GET /api/ventas`: empleado solo ve las de su sucursal; admin ve todas y puede filtrar (`sucursal_id` opcional). Nuevo filtro `metodo_pago`.
- `POST /api/ventas/{id}/anular`: `usuario_id` tambien desde `auth()` (admin-only por ruta).

### Refactor POST /api/recetas (RecetaController)

Ahora acepta **multipart/form-data** con campo `imagen` (file: jpg/png/webp/pdf, <=5MB). El archivo se guarda en `storage/app/private/recetas/` (disk `local`); `imagen_url` queda con el path relativo. Alineado con [[receta]] ("Almacenamiento local, no publico"). Se mantiene el contrato `numero OR imagen` obligatorio.

### Deuda diferida flagged

- `POST /api/movimientos-stock` acepta `tipo=ajuste` con cualquier rol auth+role:empleado. Por contrato del vault ([[movimiento-stock]] y [[rbac]] permiso `stock.adjust`) deberia ser admin-only. El UI del empleado no expone esa opcion, pero el enforcement real falta a nivel controller. Mover a policy o split de ruta. Fuera de scope de este commit.

## Split admin-only de POST /movimientos-stock/ajuste (commit 04afcf6, 2026-05-16)
Cierra la deuda flagged en el commit c3bfaa3 (seccion 'POS y empleado - endpoints agregados'). El `tipo=ajuste` del enum [[movimiento-stock]] ahora tiene su propio endpoint con enforcement real a nivel middleware, no solo UI.

### Cambio de contrato

#### `POST /api/movimientos-stock` (modificado)
**Grupo:** `auth:sanctum + role:administrador,empleado`.
**Tipos aceptados:** `devolucion_cliente`, `devolucion_proveedor`, `vencimiento`, `perdida`.
**Eliminado:** `ajuste` ya no es valor valido aca (validate('tipo', 'in:...') sin ajuste).
Usado para movimientos OPERATIVOS del flujo (devoluciones reales, vencimientos, perdidas/roturas).

#### `POST /api/movimientos-stock/ajuste` (nuevo)
**Implementacion:** `Backend/app/Http/Controllers/Api/MovimientoStockController.php::ajustar()`
**Grupo:** `auth:sanctum + role:administrador` (admin-only).
**Request:** `{ lote_id, usuario_id, cantidad: int signed (!= 0), justificacion: required string }`. El tipo se setea internamente en `'ajuste'` (no se acepta del body).
**Response 201:** movimiento + lote.

Es la operacion exclusivamente administrativa: correccion de stock por discrepancia detectada en conteo fisico, error de tipeo en alta de lote, etc. Refleja el permiso `stock.adjust` de [[rbac]] que ya documentaba admin-only.

### Patron aplicado

Mismo split que [[venta]]`@anular`: un controller con dos operaciones, una en `role:administrador,empleado` y otra en `role:administrador` por ruta separada. El controller comparte el helper privado `crearMovimiento()` para no duplicar la transaccion + lock + validacion de stock no-negativo entre `store` y `ajustar`.

### Impacto frontend

- **Admin** (`Frontend/components/custom/admin/inventario/kardex/use-admin-kardex.ts`): el wrapper `createMovimiento()` detecta `input.tipo === 'ajuste'` y rutea a `/movimientos-stock/ajuste` (saltando el campo `tipo` del payload, el backend lo fija). Transparente para el dialog admin que ya enviaba `tipo: 'ajuste'`.
- **Empleado**: cero impacto. El dialog del empleado (`Frontend/components/custom/empleado/stock/kardex/movimiento-alta-dialog.tsx`) nunca expuso `ajuste` (siguiendo [[rbac]] `stock.adjust=admin-only`), asi que ningun caller del rol empleado tocaba el endpoint comun con tipo=ajuste.

## Cliente - endpoints + refactor PedidoController (commit b54bba4, 2026-05-16)
Nuevo controller `ClienteController` y refactor de `PedidoController` para cerrar el rol cliente. Mismo patron que `VentaController`/`EmpleadoController`: el backend resuelve identidad desde `auth()->user()`, nunca del body.

### Refactor de pedidos

#### `POST /api/pedidos` (modificado)
**Implementacion:** `Backend/app/Http/Controllers/Api/PedidoController.php::store()`
**Grupo:** `auth:sanctum` (cualquier autenticado). El controller hace `abort_unless($user->esCliente())`.
**Body acepta ahora:** `{ sucursal_id, receta_id?, tipo_entrega, direccion_envio?, telefono_contacto, items[] }`. NO acepta `cliente_id` (se toma de `auth()->user()->id`).
**Cambios clave:**
- `cliente_id` viene de `auth()`. Cierra el agujero por el que un cliente podia crear pedido a nombre de otro.
- `numero_pedido` ahora es serial autoincremental por sucursal con `lockForUpdate` (formato `0000001`), alineado al invariante de [[pedido]] ("Serial por sucursal"). Antes era `P-YYYYMMDDHHMMSS-NNN`.
- Valida que la sucursal este `activa=true` y que cada medicamento pertenezca a esa sucursal (mismo patron que `VentaController`).
- `lockForUpdate` en la query FEFO al reservar lotes (evita que dos pedidos concurrentes reserven el mismo stock).

#### `GET /api/pedidos` (modificado)
**Implementacion:** `PedidoController::index()`
**Comportamiento por rol:**
- Cliente: ve SOLO sus pedidos (`where cliente_id = auth->id`). Ignora `cliente_id` y `sucursal_id` del query.
- Admin/empleado: ven todos. Filtran libremente con `cliente_id`, `sucursal_id`, `estado`.

#### `GET /api/pedidos/{id}` (modificado)
**Implementacion:** `PedidoController::show()`
**Cambio:** 403 si cliente intenta ver pedido de otro cliente.

#### `PATCH /api/pedidos/{id}/estado` (modificado)
**Implementacion:** `PedidoController::cambiarEstado()`
**Grupo:** `auth:sanctum + role:administrador,empleado` (sin cambios).
**Cambios:**
- `usuario_id_gestor` ya no viene del body, se toma de `auth()->user()->id`.
- Empleado solo puede gestionar pedidos de su propia sucursal (403 si la sucursal no coincide).
- Las transiciones validas y el descuento/reversion de stock al pasar a `entregado` / cancelar quedan iguales.

### Cliente - endpoints agregados

#### `GET /api/cliente/dashboard`
**Implementacion:** `ClienteController::dashboard()`
**Grupo:** `auth:sanctum` (el controller hace `abort_unless(esCliente())`).
**Response 200:**
```json
{
  "kpis": {
    "pedidos_pendientes": int,
    "pedidos_en_camino": int,
    "pedidos_entregados": int,
    "total_gastado": number   // SUM(total) entregados
  },
  "pedidos_recientes": [{ id, numero_pedido, sucursal_id, sucursal:{id,nombre}, estado, tipo_entrega, total, fecha_solicitud }]
}
```
Lista limitada a 8 (constante `LIST_LIMIT`).

#### `GET /api/cliente/catalogo?q=&categoria_id=&solo_sin_receta=&per_page=`
**Implementacion:** `ClienteController::catalogo()`
**Scope:** global. `stock_disponible` = SUM(lote.cantidad_actual) en lotes vigentes de sucursales activas. La sucursal especifica la elige el cliente en el checkout.
**Response 200:** paginador. Cada item `{ id, nombre_comercial, principio_activo, codigo_barras, precio, requiere_receta, categoria_id, categoria_nombre, stock_disponible }`. Filtra a `stock_disponible > 0` y `medicamentos.activo + sucursales.activa`.

#### `GET /api/cliente/medicamentos/{medicamento}/stock-por-sucursal`
**Implementacion:** `ClienteController::stockPorSucursal()`
**Response 200:** array `[{ sucursal_id, nombre, ciudad, stock }]`. Util para que el checkout valide stock en la sucursal elegida antes de confirmar (creado pero aun no consumido por el frontend - deuda menor diferida).

### Privacidad y enforcement (resumen)

- Cliente NUNCA expone telefono/direccion de terceros (RNF-04 / [[cliente]]). Los datos snapshot de la entrega (`direccion_envio`, `telefono_contacto`) viven en el [[pedido]] propio.
- `numero_pedido` es ahora serial por sucursal (no timestamp+random) - alinea con el contrato del vault.
- Mismo patron que `VentaController` para enforcement de identidad y separacion por sucursal.

## Cierre admin - endpoints (commit 9af2edb, 2026-05-17)
Endpoints que cierran el rol admin: reportes mensuales con PDF, cambio explícito de rol de usuario, y geo en sucursales.

### Sucursales con geo

La migración `add_geo_to_sucursales` extiende el shape de la entidad ([[sucursal]] sección Geo). `POST /api/sucursales` y `PUT /api/sucursales/{id}` ahora aceptan opcionalmente:
- `latitud` (numeric, nullable, between -90/90)
- `longitud` (numeric, nullable, between -180/180)

No cambia el path ni el grupo de middleware (sigue admin-only en escritura).

### `PATCH /api/usuarios/{usuario}/rol`

**Implementación:** `Backend/app/Http/Controllers/Api/UsuarioController.php::cambiarRol()`
**Grupo:** `auth:sanctum + role:administrador` (mismo grupo que el resto de la gestión de usuarios).
**Body:** `{ rol_id, sucursal_id? }`.
**Reglas (alineadas a [[usuario]] y [[rbac]]):**
- `administrador` y `empleado` exigen `sucursal_id`. 422 si falta.
- `cliente` recibe `sucursal_id=null` automáticamente (se ignora lo enviado).
- No se puede sacar el rol `administrador` del último admin activo (422). Garantiza que el sistema nunca queda sin administrador.

Es el endpoint separado que el comment de `UsuarioController::update` anticipaba ("Cambio de rol requiere endpoint separado"). El método `update` general sigue NO permitiendo cambiar `rol_id` desde su body.

### Reportes mensuales (admin-only, RNF-03)

Nuevo controller `ReportesController` con dos endpoints en `auth:sanctum + role:administrador`:

#### `GET /api/admin/reportes/mensual?year=&month=`
**Implementación:** `ReportesController::mensual()`
**Response 200:** JSON con el dataset completo del reporte (mismas tablas que el PDF para que el frontend pueda hacer preview sin descargar). Estructura:
```json
{
  "periodo": { "year", "month", "mes_label", "desde", "hasta" },
  "farmacia": { "id", "nombre", "ruc" },
  "generado_en": ISO-8601,
  "sucursales": [{ id, nombre, ciudad }],
  "ventas": {
    "totalizado": { cantidad, subtotal, impuesto_total, total },
    "por_sucursal": [{ sucursal_id, nombre, ciudad, cantidad, subtotal, impuesto_total, total }],
    "por_metodo": [{ metodo_pago, cantidad, total }]
  },
  "stock_critico": [{ sucursal, items: [{ medicamento_id, medicamento_nombre, stock_actual, stock_minimo }] }],
  "kardex": {
    "totalizado": [{ tipo, cantidad, unidades }],
    "por_sucursal": [{ sucursal, tipos: [{ tipo, cantidad, unidades }] }]
  }
}
```

#### `GET /api/admin/reportes/mensual.pdf?year=&month=`
**Implementación:** `ReportesController::mensualPdf()`
Dispatcheo: `Pdf::loadView('reportes.mensual', $data)->download()` (barryvdh/laravel-dompdf). Template Blade en `Backend/resources/views/reportes/mensual.blade.php` con encabezado etiquetado (período, farmacia, RUC, generado), tres secciones (Ventas, Stock crítico, Kardex), estilos compatibles con DOMPDF.

**Reglas del dataset (alineadas al vault):**
- Ventas: solo `estado=completada` ([[venta]]) — anuladas se excluyen del reporte de ingresos.
- Stock crítico: snapshot **al día de hoy** cuando el `fin` del período no es futuro. Si el período aún no cerró (mes actual), se devuelve igual; si el período es futuro, viene vacío y el PDF muestra mensaje "Período aún no cerrado".
- Kardex: conteo por los 7 tipos canónicos de [[movimiento-stock]].
- Pedidos NO se incluyen (decisión del sprint para mantener foco en mostrador + inventario).

**Limitación documentada (deuda):** stock crítico no es histórico real — el snapshot usa stock actual, no el estado al día `hasta`. Para meses pasados puede no reflejar la realidad. Pendiente: tabla de series temporales si el negocio requiere reportes retroactivos exactos.

## Self-edit perfil - endpoints auth/me (commit fd5a11a, 2026-05-17)
Dos endpoints nuevos en el grupo `auth:sanctum` (cualquier rol autenticado) que permiten al usuario editar su propio perfil sin tocar `PUT /api/usuarios/{id}` (que sigue siendo admin/general y no aplicaba whitelist por rol). Patron self-edit: el backend resuelve la identidad desde `auth()->user()` y aplica una whitelist estricta de campos.

### `PUT /api/auth/me`
**Implementacion:** `Backend/app/Http/Controllers/Api/AuthController.php::updateMe()`
**Grupo:** `auth:sanctum`.
**Body acepta (whitelist por rol):**
- `nombre` (sometimes, string, max 255) - todos los roles.
- `telefono` (sometimes, nullable, string, max 50) - todos los roles.
- `direccion` (sometimes, nullable, string, max 255) - **solo cliente** (RNF-04 / [[cliente]]). Si llega para admin o empleado, se ignora silenciosamente (no esta en `rules`).

**Bloqueado** (no se acepta del body, ni siquiera para ignorar): `email`, `password`, `sucursal_id`, `rol_id`, `activo`, `google_oauth_id`. Email es read-only en V1 (decision del sprint: cambiar email implica re-verificacion y rotar OAuth link, fuera de scope). Cambio de password va por endpoint separado. Sucursal/rol/activo son admin-only via `PUT /usuarios/{id}` y `PATCH /usuarios/{id}/rol`.

**Response 200:** usuario actualizado con `rol` y `sucursal` cargados.

### `POST /api/auth/me/password`
**Implementacion:** `AuthController::updatePassword()`
**Grupo:** `auth:sanctum`.
**Body:** `{ password_actual, password_nueva }` (ambos required, min 8, `different`).
**Reglas:**
- Verifica `Hash::check(password_actual, user.password)`. 422 con `errors.password_actual` si no matchea.
- `password_nueva` se hashea con `Hash::make` antes de persistir.
- **Revoca todos los otros tokens del usuario**, preserva solo el de la sesion actual (`currentAccessToken()->id`). Forza re-login en otros dispositivos como medida de seguridad post-cambio.

**Response 204** (sin body).

### Frontend que consume
`Frontend/components/custom/perfil/_shared/use-self-profile.ts` (`updateProfile`, `updatePassword`). Tras el PUT, hidrata el `user` del `AuthContext` con la respuesta para que el resto de la UI vea los datos nuevos sin re-fetch.

### Nota sobre `PUT /api/usuarios/{id}` previo
Ese endpoint sigue existiendo (admin lo usa para gestionar otros usuarios) pero **no debe consumirse para self-edit**. Su comentario `// admin o self - refinar con policy` queda como deuda: cuando se agregue policy real, `auth/me` queda como API publica y el endpoint general queda admin-only por policy. Por ahora, el split por ruta es enforcement suficiente (cliente no tiene `users.manage` en [[rbac]] y el aside cliente no expone gestion de usuarios).

## Cierre RF-06/RF-08/RF-13 - PDF venta + top productos + descuento_item UI (commit 01caa90, 2026-05-17)
Cierra tres RF que quedaban parciales sin endpoints nuevos masivos: un endpoint dedicado para el comprobante PDF de venta, un append al dataset del reporte mensual, y consumo del campo `descuento_item` que el backend ya aceptaba.

### `GET /api/ventas/{venta}/comprobante.pdf` (nuevo)
**Implementacion:** `Backend/app/Http/Controllers/Api/VentaController.php::comprobantePdf()`
**Grupo:** `auth:sanctum + role:administrador,empleado` (mismo grupo que `show` y `index`).
**Scope:** empleado solo accede a ventas de su sucursal (`abort 403` si no coincide); admin a todas.
**Response:** `application/pdf` (download) renderizado con Blade + barryvdh/laravel-dompdf. Template en `Backend/resources/views/ventas/comprobante.blade.php`.

**Patron de descarga frontend:** mismo blob+Bearer que `descargarReportePdf` (helper `descargarComprobantePdf` en `Frontend/components/custom/empleado/pos/use-pos.ts`). Consumido desde dos puntos: el dialog post-venta del POS (`pos-comprobante-dialog`) y el dialog de detalle del historial de ventas (`venta-detalle-dialog`).

**Cierra RF-08** ("Generación de un comprobante de venta simplificado en formato PDF para impresión o envío por correo"). El `window.print()` previo se mantiene como atajo alternativo de impresion directa.

### Extension de `GET /api/admin/reportes/mensual` (y .pdf)
**Implementacion:** `ReportesController::seccionTopProductos()` (nueva, agregada al `armarReporte()`).
**Cambio de shape del response:** la clave `top_productos` se agrega al payload JSON y al PDF:
```json
{
  ...
  "top_productos": [
    { "medicamento_id", "nombre_comercial", "principio_activo", "unidades", "monto", "ventas_distintas" }
  ]
  ...
}
```
**Query:** JOIN `venta_items + ventas + lotes + medicamentos`, filtra `ventas.estado=completada` y `ventas.fecha BETWEEN inicio AND fin`, agrupa por medicamento, ordena `unidades DESC, monto DESC`, `LIMIT 10`.

**Frontend que lo consume:** card "Productos mas vendidos" en `/admin/reportes` (`reportes-data.tsx`) + tabla equivalente en el PDF mensual (template Blade actualizado).

**Cierra RF-13** ("Generación de reportes diarios/mensuales que muestren los ingresos y los productos más vendidos para optimizar las compras a proveedores"). El componente "diarios" del RF sigue cubierto solo por el KPI `ventas_del_dia` del dashboard admin (no hay endpoint `/reportes/diario` dedicado); decision pendiente si el negocio lo requiere explicitamente.

### Consumo de `descuento_item` desde el POS UI
El backend ya aceptaba `items.*.descuento_item` en `POST /api/ventas` (validacion `nullable, numeric, min:0`); el frontend no lo enviaba. En este commit el POS expone el campo a nivel de UI (input colapsable por linea en `pos-cart.tsx`), clampeado a `[0, precio*cantidad]`, y lo incluye condicionalmente en el payload solo cuando es `> 0`.

**Cierra RF-06** (carrito con descuentos). El descuento se reparte proporcionalmente entre lotes FEFO en el backend cuando un item se sirve desde varios lotes (logica existente).

**Deuda flagged (no resuelta en este commit):** `descuento_total` (descuento global por venta, no por item) sigue hardcoded en `0` en `VentaController::store()`. Su autorizacion requiere un flujo admin-in-the-loop (override con permiso especifico) que esta fuera de scope. El campo del modelo [[venta]] existe; solo falta la UI + permiso.
