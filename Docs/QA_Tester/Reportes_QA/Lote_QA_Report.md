# Reporte de QA: Modelo Lote (Archivo 2)

**Fecha:** 31 de mayo de 2026
**Estado:** ✅ PASADO

## 1. Archivo Analizado

`Backend/app/Models/Lote.php`

Este archivo define el comportamiento de los lotes de medicamentos. Es vital para la seguridad del paciente (evitar productos vencidos) y el control de inventario.

## 2. Escenarios Probados

### Escenario A: Detección de lotes Vencidos

- **¿Qué probamos?**: Creamos un lote con fecha de vencimiento de ayer.
- **Resultado esperado**: El atributo `estado` debe ser "vencido".
- **Resultado obtenido**: ✅ El sistema identificó correctamente el lote como caducado.

### Escenario B: Alerta de Próximo a Vencer

- **¿Qué probamos?**: Creamos un lote que vence en 15 días.
- **Resultado esperado**: El atributo `estado` debe ser "proximo_a_vencer" (umbral de 30 días).
- **Resultado obtenido**: ✅ El sistema activó la alerta correctamente.

### Escenario C: Lote Vigente

- **¿Qué probamos?**: Un lote con vencimiento en 6 meses.
- **Resultado esperado**: El atributo `estado` debe ser "vigente".
- **Resultado obtenido**: ✅ Validado correctamente.

### Escenario D: Relaciones de Base de Datos

- **¿Qué probamos?**: Verificamos que un lote esté correctamente vinculado a su Medicamento y Sucursal.
- **Resultado esperado**: Al pedir el nombre del medicamento desde el lote, este debe ser devuelto sin errores.
- **Resultado obtenido**: ✅ Las conexiones entre tablas son sólidas.

## 3. Notas Técnicas de la Prueba

- **Transaccionalidad**: Las pruebas se ejecutaron en un entorno aislado de PostgreSQL.
- **Integridad**: Se descubrió que el modelo tiene restricciones muy estrictas de "No Nulos" en la base de datos (requiere proveedor, ubicación física, etc.), lo cual es excelente para la calidad del dato.

## 4. Explicación para Principiantes

Imagina que cada caja de medicina tiene una etiqueta inteligente que cambia de color:

1. Si ya pasó la fecha, se pone **Roja** (Vencido).
2. Si falta menos de un mes, se pone **Amarilla** (Alerta).
3. Si está bien, se queda **Verde**.

Hoy probamos que esas "etiquetas" cambien de color exactamente cuando deben, asegurando que nunca le des a un cliente algo que no debería tomar.

---
