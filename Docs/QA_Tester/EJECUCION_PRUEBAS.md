1. Pruebas del Backend (Laravel)
   Asegúrate de estar en la carpeta Backend antes de ejecutarlos.

- Ejecutar todas las pruebas del tirón:
  1 php artisan test
- Ejecutar solo el Archivo 1 (Ventas):

1 php artisan test tests/Feature/VentaControllerTest.php

- Ejecutar solo el Archivo 2 (Lotes/Inventario):

1 php artisan test tests/Feature/LoteTest.php

- Ejecutar solo el Archivo 4 (Login/Autenticación):

1 php artisan test tests/Feature/AuthControllerTest.php

- Ejecutar solo el Archivo 5 (Reportes Financieros):

1 php artisan test tests/Feature/ReportesControllerTest.php

---

2. Pruebas del Frontend (Next.js)
   Asegúrate de estar en la carpeta Frontend antes de ejecutarlos.

- Ejecutar el Archivo 3 (Permisos y Seguridad):
  1 npx tsx tests/Unit/PermissionsTest.ts
