---
status: locked
---

# Roles del Sistema

| Rol | Acceso | Restricción clave |
|-----|--------|-------------------|
| Administrador | Total — todos los módulos | — |
| Empleado | POS + Gestión de Pedidos | No modifica precios ni elimina inventario |
| Cliente | Catálogo público + sus pedidos | Solo ve/gestiona lo propio |
| Invitado | Catálogo (solo lectura) | Sin autenticación |

**Invariante**: Modificar precios, eliminar productos y reportes estratégicos → exclusivo del Administrador.
**Privacidad**: Datos de contacto del cliente (dirección, teléfono) → visibles solo en contexto de gestión de entregas.

Relaciones: [[vision]] [[pedido]] [[venta]]
