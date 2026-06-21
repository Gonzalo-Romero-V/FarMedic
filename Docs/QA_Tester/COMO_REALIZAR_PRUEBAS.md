# Guía Manual: Cómo Ejecutar las Pruebas de FarMedic

Esta guía detalla los pasos necesarios para ejecutar las pruebas unitarias y funcionales del proyecto de forma manual. Sigue estos pasos para asegurar la estabilidad del sistema antes de realizar cambios importantes.

---

## 1. Requisitos Previos

Antes de correr las pruebas, asegúrate de tener configurado lo siguiente:

### A. Extensiones de PHP (Archivo `php.ini`)
Asegúrate de que estas líneas no tengan un `;` al principio en tu archivo `C:\tools\php83\php.ini`:
```ini
extension=fileinfo
extension=pdo_pgsql
extension=pgsql
extension=zip
```

### B. Base de Datos de Pruebas
**IMPORTANTE:** Las pruebas utilizan la base de datos configurada en `Backend/phpunit.xml`. 
Actualmente está configurado para usar `farmedic`, pero se recomienda crear una base de datos vacía llamada `farmedic_test` para no borrar tus datos de trabajo.

Para crearla (opcional pero recomendado):
```sql
CREATE DATABASE farmedic_test;
```
Luego, cambia el nombre en `Backend/phpunit.xml`:
```xml
<env name="DB_DATABASE" value="farmedic_test"/>
```

---

## 2. Ejecutar Pruebas del Backend (Laravel)

Las pruebas del backend validan la lógica de ventas, stock, autenticación y reportes.

### Pasos:
1. Abre una terminal en la carpeta `Backend`.
2. Ejecuta todas las pruebas:
   ```bash
   php artisan test
   ```
3. Ejecutar un archivo específico (ejemplo VentaController):
   ```bash
   php artisan test tests/Feature/VentaControllerTest.php
   ```

### Qué significan los resultados:
- **Puntos verdes (.) o "PASS":** La prueba pasó exitosamente.
- **F o "FAIL":** La prueba falló. Revisa el mensaje de error para ver qué lógica no se cumplió.
- **E o "ERROR":** Hubo un problema técnico (ej. conexión a base de datos fallida).

---

## 3. Ejecutar Pruebas del Frontend (Next.js)

Actualmente, las pruebas del frontend validan la lógica de permisos y seguridad.

### Pasos:
1. Abre una terminal en la carpeta `Frontend`.
2. Ejecuta la prueba de permisos:
   ```bash
   npx tsx tests/Unit/PermissionsTest.ts
   ```

### Qué significan los resultados:
- Verás una lista de mensajes con ✅ **PASÓ** o ❌ **FALLÓ**.
- Si todo está correcto, terminará con el mensaje "--- Pruebas Finalizadas con Éxito ---".

---

## 4. Estructura de las Pruebas en el Proyecto

Si deseas revisar el código de las pruebas para entender qué se está validando:

| Archivo de Prueba | Ubicación | Qué Prueba |
|-------------------|-----------|------------|
| **VentaControllerTest.php** | `Backend/tests/Feature/` | Stock FEFO, cálculos de IVA y Totales. |
| **LoteTest.php** | `Backend/tests/Feature/` | Fechas de vencimiento y estados de lote. |
| **AuthControllerTest.php** | `Backend/tests/Feature/` | Login, Registro y Logout seguro. |
| **ReportesControllerTest.php** | `Backend/tests/Feature/` | Precisión de cifras financieras mensuales. |
| **PermissionsTest.ts** | `Frontend/tests/Unit/` | Reglas de acceso (Admin, Empleado, Cliente). |

---

## 5. Solución de Problemas Comunes

- **"could not find driver":** Falta habilitar `pdo_pgsql` en el `php.ini`.
- **"Database does not exist":** La base de datos especificada en `phpunit.xml` no ha sido creada en PostgreSQL.
- **"Foreign key violation":** Generalmente ocurre si los roles base no existen. Asegúrate de que las pruebas tengan el código para crear los roles (lo cual ya incluí en los archivos actuales).

---
*Manual generado el 31 de mayo de 2026.*
