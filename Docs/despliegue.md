# Comandos de despliegue local — FarMedic

## Backend (Laravel, puerto 8000)
```powershell
cd Backend
php artisan serve --port=8000
```

## Frontend (Next.js, puerto 3000)
```powershell
cd Frontend
npm run dev

npm run build
npm run start
```

## Túnel (Cloudflare → financehub.cc)
```powershell
cloudflared tunnel run far-medic   
```

## Pendientes
Notas: 
Corregir hora en administrador (consistencia de hora fecha en general)

Corregir el hecho de ventas y pedidos:
Una pedido entregado debería aparecer en sección ventas

Rutas de comprobantes
