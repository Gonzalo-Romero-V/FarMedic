# Reporte de QA: Permisos y Seguridad Frontend (Archivo 3)

**Fecha:** 31 de mayo de 2026
**Estado:** ✅ PASADO

## 1. Archivo Analizado

`Frontend/lib/permissions/index.ts` (y `can.ts`)

Este archivo es el "cerebro" de la seguridad en la interfaz de usuario. Decide qué botones puede ver un Administrador, qué módulos puede usar un Empleado y qué puede hacer un Cliente.

## 2. Escenarios Probados

### Escenario A: Poderes del Administrador

- **¿Qué probamos?**: Verificamos si el rol `administrador` tiene acceso a funciones críticas como `users.manage` (gestión de usuarios) y `stock.adjust` (ajuste de stock).
- **Resultado esperado**: Acceso permitido.
- **Resultado obtenido**: ✅ El admin tiene todos los permisos globales necesarios.

### Escenario B: Restricciones de Empleado

- **¿Qué probamos?**: Validamos que el `empleado` pueda vender (`pos.sell`) pero NO pueda gestionar otros usuarios.
- **Resultado esperado**: Solo acceso a ventas.
- **Resultado obtenido**: ✅ El sistema bloqueó correctamente las funciones administrativas para el empleado.

### Escenario C: Seguridad del Cliente e Invitado

- **¿Qué probamos?**: Un cliente debe poder crear pedidos, pero un invitado (sin login) solo debe poder ver el catálogo.
- **Resultado esperado**: El invitado no puede crear pedidos.
- **Resultado obtenido**: ✅ Las protecciones de acceso para usuarios externos funcionan perfectamente.

### Escenario D: Funciones Avanzadas (canAny)

- **¿Qué probamos?**: Probamos si el sistema reconoce cuando un usuario tiene "al menos uno" de varios permisos.
- **Resultado obtenido**: ✅ La lógica de validación múltiple es correcta.

## 3. Notas Técnicas de la Prueba

- **Entorno**: Se utilizó `tsx` para ejecutar las pruebas directamente sobre el código de TypeScript del Frontend, asegurando que la lógica que corre en el navegador sea la misma que probamos.
- **Configuración**: Se creó la estructura `Frontend/tests/Unit/` para organizar futuras pruebas de la interfaz.

## 4. Explicación para Principiantes

Imagina que la farmacia tiene diferentes llaves:

1.  **La Llave Maestra** (Admin): Abre todas las puertas, incluyendo la oficina del gerente y la caja fuerte.
2.  **La Llave del Mostrador** (Empleado): Solo abre la puerta principal y la caja registradora.
3.  **La Puerta de Vidrio** (Invitado): Solo permite ver los productos desde afuera.

Hoy probamos que cada "llave" abra exactamente la puerta que le corresponde y que nadie pueda entrar a una oficina si no tiene la llave correcta.

---
