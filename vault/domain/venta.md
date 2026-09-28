---
status: stable
code_path: Backend/app/Models/Venta.php
---

# Venta (POS)

**Qué**: Transacción de venta presencial en el mostrador.
**Por qué**: Flujo principal de ingresos del negocio (RF-05 a RF-08).

## Atributos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | int (pk) | |
| `sucursal_id` | int (fk) | → [[sucursal]] |
| `usuario_id` | int (fk) | → [[usuario]] (empleado que la realizó) |
| `cliente_id` | int (fk) nullable | → [[cliente]] (opcional, si es cliente registrado) |
| `receta_id` | int (fk) nullable | → [[receta]] (si algún item lo requería) |
| `numero_comprobante` | string | Serial autoincremental por sucursal |
| `subtotal` | decimal(10,2) | Suma de subtotales de items antes de descuento global |
| `descuento_total` | decimal(10,2) | Descuento global (requiere autorización admin) |
| `iva_tasa_aplicada` | decimal(5,2) | **Snapshot** de la tasa al momento (audit, no FK) |
| `impuesto_total` | decimal(10,2) | IVA calculado sobre (subtotal − descuento) |
| `total` | decimal(10,2) | Total final cobrado |
| `metodo_pago` | enum | `efectivo`, `tarjeta`, `transferencia` |
| `estado` | enum | `completada`, `anulada` |
| `comprobante_pdf_url` | string nullable | URL al PDF generado (RF-08) |
| `fecha` | timestamp | |
| `created_at`, `updated_at` | timestamp | |

## Relaciones

| Tipo | Con | Detalle |
|------|-----|---------|
| N → 1 | [[sucursal]] | `sucursal_id` |
| N → 1 | [[usuario]] | `usuario_id` (vendedor) |
| N → 0..1 | [[cliente]] | `cliente_id` |
| N → 0..1 | [[receta]] | `receta_id` |
| 1 → N | [[venta-item]] | `venta_item.venta_id` |
| 1 → N | [[movimiento-stock]] | uno por cada item, tipo='venta' con referencia → esta venta |

## Reglas e invariantes

- Descuento global requiere autorización de Administrador (RF-06).
- Si algún `venta_item` apunta a un [[medicamento]] con `requiere_receta=true` → `receta_id NOT NULL`.
- Al confirmar venta: por cada item se descuenta del [[lote]] (FEFO) y se crea un [[movimiento-stock]] tipo `venta`.
- `estado='anulada'`: se generan movimientos inversos (`devolucion_cliente`) para restituir stock.
- `iva_tasa_aplicada = farmacia.iva_tasa` al momento de la venta (snapshot, no FK reactivo).
- `numero_comprobante` único por `sucursal_id`.

## Flujo

```
búsqueda (nombre / principio_activo / código_barras) →
  agregar al carrito →
    [si requiere_receta → solicitar receta] →
      seleccionar método_pago →
        confirmar →
          descontar lotes FEFO + crear movimientos →
            generar PDF
```

## Tabla SQL

`ventas`

## Relacionado

[[venta-item]] [[receta]] [[usuario]] [[cliente]] [[movimiento-stock]] [[sucursal]] [[data-model]]
