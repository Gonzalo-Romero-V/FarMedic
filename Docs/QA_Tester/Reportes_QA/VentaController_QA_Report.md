# Reporte de QA: VentaController (Archivo 1)

**Fecha:** 31 de mayo de 2026
**Estado:** ✅ PASADO

## 1. Archivo Analizado

`Backend/app/Http/Controllers/Api/VentaController.php`

Este archivo es el responsable de gestionar las ventas de la farmacia. Es crítico porque maneja dinero (cálculos de IVA y totales) y productos (descuento de inventario).

## 2. Escenarios Probados

### Escenario A: Venta exitosa con cálculo de IVA y FEFO

- **¿Qué probamos?**: Creamos un medicamento con dos lotes (uno que vence pronto y otro después). Simulamos una venta que requiere usar unidades de ambos lotes.
- **Resultado esperado**:
  - El sistema debe calcular correctamente el Subtotal y el IVA (15%).
  - Debe vaciar primero el lote que vence más pronto (**FEFO**).
- **Resultado obtenido**: ✅ El sistema calculó un total de $138.00 para una venta de $120.00 + IVA, y descontó el stock del lote correcto.

### Escenario B: Intento de venta sin stock suficiente

- **¿Qué probamos?**: Intentamos vender 10 unidades de un producto que solo tiene 5 en stock.
- **Resultado esperado**: El sistema debe rechazar la venta con un error "422" y un mensaje de "Stock insuficiente".
- **Resultado obtenido**: ✅ El sistema bloqueó la venta y protegió la integridad del inventario.

## 3. Notas Técnicas de la Prueba

- **Entorno**: Se configuró `phpunit.xml` para usar PostgreSQL debido a la falta de soporte para SQLite en el entorno local.
- **Mejoras realizadas**: Se identificaron campos obligatorios en la base de datos que no estaban siendo considerados en la creación de objetos de prueba (`telefono_contacto`, `categoria_id`, etc.).

## 4. Explicación para Principiantes

Imagina que un cliente llega a la farmacia y pide 12 cajas de Paracetamol. En el estante tienes 10 cajas que vencen el próximo mes y 10 que vencen en un año.
Lo que probamos hoy asegura que:

1. El sistema le cobre los impuestos correctos automáticamente.
2. El sistema obligue al vendedor a entregar primero las 10 cajas que vencen pronto para que no se caduquen en la percha.
3. Si el cliente pide más de lo que hay, el sistema no permita hacer la venta "en el aire", evitando errores en las cuentas al final del día.

---
