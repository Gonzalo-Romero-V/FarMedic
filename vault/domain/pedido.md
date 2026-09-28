---
status: stable
code_path: Backend/app/Models/Pedido.php
---

# Pedido (Canal Online)

**Qué**: Orden de compra generada por un [[cliente]] desde el portal web.
**Por qué**: Extiende el alcance comercial fuera del local físico (RF-09 a RF-11).

## Atributos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | int (pk) | |
| `sucursal_id` | int (fk) | → [[sucursal]] que atiende el pedido |
| `cliente_id` | int (fk) | → [[cliente]] |
| `usuario_id_gestor` | int (fk) nullable | → [[usuario]] empleado que gestiona |
| `receta_id` | int (fk) nullable | → [[receta]] si aplica |
| `numero_pedido` | string | Serial por sucursal |
| `tipo_entrega` | enum | `retiro_local`, `domicilio` |
| `direccion_envio` | string nullable | **Snapshot** del momento (requerido si `domicilio`) |
| `telefono_contacto` | string | Snapshot |
| `estado` | enum | `pendiente`, `en_camino`, `entregado`, `cancelado` |
| `subtotal` | decimal(10,2) | |
| `iva_tasa_aplicada` | decimal(5,2) | **Snapshot** |
| `impuesto_total` | decimal(10,2) | |
| `total` | decimal(10,2) | |
| `fecha_solicitud` | timestamp | Cuando el cliente confirma |
| `fecha_envio` | timestamp nullable | Pasaje a `en_camino` |
| `fecha_entrega` | timestamp nullable | Pasaje a `entregado` |
| `created_at`, `updated_at` | timestamp | |

## Relaciones

| Tipo | Con | Detalle |
|------|-----|---------|
| N → 1 | [[sucursal]] | `sucursal_id` |
| N → 1 | [[cliente]] | `cliente_id` |
| N → 0..1 | [[usuario]] | `usuario_id_gestor` |
| N → 0..1 | [[receta]] | `receta_id` |
| 1 → N | [[pedido-item]] | `pedido_item.pedido_id` |
| 1 → N | [[movimiento-stock]] | tipo='venta' al pasar a `entregado` |

## Reglas e invariantes

- Invitado puede ver catálogo pero NO crear pedidos (requiere registro como [[cliente]]).
- `direccion_envio NOT NULL` si `tipo_entrega='domicilio'`.
- Cambios de estado solo por Empleado o Administrador (RF-11).
- Estados secuenciales: `pendiente → en_camino → entregado`. `cancelado` puede ocurrir desde cualquiera previo a entrega.
- Al pasar a `entregado`: setea `fecha_entrega` y crea [[movimiento-stock]] tipo `venta` por cada item.
- `cancelado` después de tener movimientos creados → revertir con `devolucion_cliente`.
- `iva_tasa_aplicada` snapshot al momento de confirmar el pedido.
- Lista de pedidos priorizada por `fecha_solicitud` DESC.

## Flujo

```
catálogo público →
  login cliente →
    armar carrito →
      seleccionar tipo_entrega →
        [si requiere_receta → subir receta] →
          confirmar →
            asignar lotes (FEFO) →
              empleado gestiona (pendiente → en_camino → entregado) →
                generar movimientos
```

## Tabla SQL

`pedidos`

## Relación indirecta con catálogo

Cada [[pedido-item]] referencia [[medicamento]] (estable) y [[lote]] (reservado FEFO al confirmar).

## Relacionado

[[pedido-item]] [[cliente]] [[usuario]] [[receta]] [[movimiento-stock]] [[medicamento]] [[lote]] [[sucursal]] [[data-model]]

