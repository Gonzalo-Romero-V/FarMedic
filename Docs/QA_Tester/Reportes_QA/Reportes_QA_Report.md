# Reporte de QA: Reportes Financieros (Archivo 5)

**Fecha:** 31 de mayo de 2026
**Estado:** ✅ PASADO

## 1. Archivo Analizado

`Backend/app/Http/Controllers/Api/ReportesController.php`

Este archivo es el encargado de generar los informes mensuales de ventas, inventario y movimientos de stock. Es la herramienta principal para la toma de decisiones del dueño de la farmacia.

## 2. Escenarios Probados

### Escenario A: Precisión del Período Mensual

- **¿Qué probamos?**: Creamos ventas en el mes de mayo y ventas en el mes de abril. Luego generamos el reporte solo para mayo.
- **Resultado esperado**: El reporte solo debe sumar las ventas de mayo.
- **Resultado obtenido**: ✅ El sistema filtró correctamente las fechas y no mezcló las ventas de diferentes meses.

### Escenario B: Exclusión de Ventas Anuladas

- **¿Qué probamos?**: Registramos una venta normal de $115 y una venta anulada de $575.
- **Resultado esperado**: El reporte debe mostrar que solo ingresaron $115.
- **Resultado obtenido**: ✅ El sistema ignora las ventas anuladas en los totales financieros, evitando inflar los ingresos de forma errónea.

### Escenario C: Seguridad de Datos Sensibles

- **¿Qué probamos?**: Intentamos acceder al reporte usando una cuenta de "Empleado".
- **Resultado esperado**: El sistema debe denegar el acceso (Error 403).
- **Resultado obtenido**: ✅ Solo el administrador puede ver la información financiera detallada.

## 3. Notas Técnicas de la Prueba

- **Integridad**: El reporte utiliza funciones de agregación de base de datos (`SUM`, `COUNT`) que fueron validadas contra inserciones manuales en el entorno de pruebas.
- **Localización**: Se verificó que el nombre del mes aparezca correctamente en español (ej. "mayo 2026").

## 4. Explicación para Principiantes

Imagina que al final del mes quieres saber cuánto dinero ganaste:

1. El sistema separa automáticamente lo que vendiste hoy de lo que vendiste el mes pasado.
2. Si un cliente devolvió un producto o cancelaste una venta por error, el sistema no cuenta ese dinero como ganado, así que tus cuentas siempre cuadran.
3. Lo más importante: esta información es privada. Solo tú (el Admin) puedes ver el libro de cuentas; los empleados no tienen acceso a ver cuánto dinero total entra en la farmacia.

---
