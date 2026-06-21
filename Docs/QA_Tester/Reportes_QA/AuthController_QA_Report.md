# Reporte de QA: Autenticación (Archivo 4)

**Fecha:** 31 de mayo de 2026
**Estado:** ✅ PASADO

## 1. Archivo Analizado

`Backend/app/Http/Controllers/Api/AuthController.php`

Este archivo es la puerta de entrada al sistema. Controla quién puede entrar, cómo se registran los nuevos clientes y cómo se cierran las sesiones de forma segura.

## 2. Escenarios Probados

### Escenario A: Inicio de Sesión Exitoso

- **¿Qué probamos?**: Intentamos entrar con un email y contraseña correctos.
- **Resultado esperado**: El sistema debe reconocer al usuario y entregarle un "token" (una llave digital) para navegar por la aplicación.
- **Resultado obtenido**: ✅ El sistema devolvió el usuario y su token correctamente.

### Escenario B: Bloqueo por Credenciales Incorrectas

- **¿Qué probamos?**: Intentamos entrar con una contraseña equivocada.
- **Resultado esperado**: El sistema debe denegar el acceso con un mensaje de "Credenciales inválidas" y un error 401.
- **Resultado obtenido**: ✅ El sistema bloqueó el acceso no autorizado como se esperaba.

### Escenario C: Registro de Nuevos Clientes

- **¿Qué probamos?**: Simulamos a una persona nueva registrándose desde la página web.
- **Resultado esperado**: El sistema debe crear la cuenta automáticamente y asignarle el rol de "cliente".
- **Resultado obtenido**: ✅ El usuario se creó correctamente y se le asignó el rol restringido de cliente.

### Escenario D: Cierre de Sesión (Logout)

- **¿Qué probamos?**: El usuario decide salir del sistema.
- **Resultado esperado**: La "llave digital" (token) debe ser destruida para que nadie pueda reusarla.
- **Resultado obtenido**: ✅ El token fue eliminado exitosamente de la base de datos al cerrar sesión.

## 3. Notas Técnicas de la Prueba

- **Seguridad**: Se verificó que las contraseñas se manejen con encriptación (Bcrypt).
- **Tokens**: El sistema utiliza Laravel Sanctum para la gestión de sesiones móviles y web, lo cual es un estándar moderno de seguridad.

## 4. Explicación para Principiantes

Imagina que la farmacia tiene una puerta con un recepcionista:

1. Si das tu identificación y clave correctas, te da un carnet de visitante (Token).
2. Si la clave es mala, no te deja pasar.
3. Si eres un cliente nuevo, te toma los datos y te da un carnet que solo te permite estar en el área de compras (Rol Cliente).
4. Cuando te vas, le devuelves el carnet y él lo rompe para que nadie más lo use.

Hoy confirmamos que el "recepcionista" de tu sistema hace su trabajo sin equivocarse.

---
