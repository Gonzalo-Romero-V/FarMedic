---
status: stable
code_path: Backend/app/Models/Sucursal.php
---

# Sucursal

**Qué**: Local físico de una [[farmacia]]. Unidad operativa donde se almacena stock, se atienden ventas y se procesan pedidos.
**Por qué**: Pivote del multi-tenancy. Todo dato operativo se ancla a una sucursal — habilita consultas cruzadas tipo "stock de X en sucursales de Riobamba".

## Atributos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | int (pk) | |
| `farmacia_id` | int (fk) | → [[farmacia]] |
| `nombre` | string | Ej. "FarMedic Centro Riobamba" |
| `ciudad` | string (indexed) | Ej. "Riobamba" — clave para consultas geográficas |
| `direccion` | string | Calle, número, referencia |
| `telefono` | string | |
| `activa` | boolean | Default true |
| `created_at`, `updated_at` | timestamp | |

## Relaciones

| Tipo | Con | Detalle |
|------|-----|---------|
| N → 1 | [[farmacia]] | `farmacia_id` |
| 1 → N | [[usuario]] | `usuario.sucursal_id` (empleados; cliente lo tiene NULL) |
| 1 → N | [[medicamento]] | `medicamento.sucursal_id` |
| 1 → N | [[lote]] | `lote.sucursal_id` (denormalizado) |
| 1 → N | [[venta]] | `venta.sucursal_id` |
| 1 → N | [[pedido]] | `pedido.sucursal_id` |
| 1 → N | [[movimiento-stock]] | `movimiento_stock.sucursal_id` |

## Reglas e invariantes

- Toda entidad operativa lleva `sucursal_id NOT NULL` excepto [[cliente]] (puede pedir de cualquier sucursal).
- Búsquedas cruzadas: filtrar por `sucursal.ciudad` o IN (lista de sucursales).
- Admin con policy multi-sucursal puede consultar todas; Empleado restringido a su `sucursal_id`.

## Tabla SQL

`sucursales`

## Relacionado

[[farmacia]] [[usuario]] [[medicamento]] [[lote]] [[venta]] [[pedido]] [[movimiento-stock]] [[data-model]]

## Geo (latitud/longitud) - commit 9af2edb 2026-05-17
Migración `2026_05_17_005327_add_geo_to_sucursales` agrega dos columnas opcionales para georreferenciar la sucursal en el mapa admin.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `latitud` | decimal(10,7) nullable | Rango [-90, 90]. Precisión ~ centímetros. |
| `longitud` | decimal(10,7) nullable | Rango [-180, 180]. |

**Validación backend** (`SucursalController::store` / `update`): `numeric + between:-90,90` y `-180,180`. Ambos campos son opcionales — sucursales sin coordenadas no aparecen en el mapa, pero siguen apareciendo en la tabla.

**Uso**: el módulo admin `/admin/sucursales` usa Leaflet + OpenStreetMap para pintar marcadores por sucursal con popups (nombre/ciudad/dirección/teléfono/estado). El form de alta/edición soporta pick-on-map (click en mapa setea lat/lng automáticamente). Ver [[frontend-modules]] para detalles.

**Por qué decimal(10,7)** y no decimal nativo: DECIMAL preserva exactitud y evita drift por redondeo flotante. 7 decimales dan ~11mm de precisión a nivel ecuador, sobrado para ubicar locales.
