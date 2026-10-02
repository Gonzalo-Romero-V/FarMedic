# FarMedic — Estado operativo y guía de despliegue

> Última actualización: junio 2026 — sistema en producción.

---

## URLs de producción

| Servicio | URL |
|----------|-----|
| **Frontend (Vercel)** | https://far-medic.vercel.app |
| **Backend API (Render)** | https://farmedic.onrender.com |
| **Base de datos (Neon)** | `ep-summer-boat-ac93nkbb.sa-east-1.aws.neon.tech` / `neondb` |

---

## Infraestructura

| Capa | Plataforma | Plan | Notas |
|------|-----------|------|-------|
| Frontend | Vercel | Free | Auto-deploy desde `main` · Root dir: `Frontend` |
| Backend | Render | Free | Docker · Auto-deploy desde `main` · Puede hibernar tras 15 min inactivo |
| Base de datos | Neon PostgreSQL | Free | SSL requerido (`sslmode=require`) · Región: `sa-east-1` |
| Auth Google | Google Cloud Console | — | Proyecto: `FarMedic` · OAuth 2.0 habilitado |

---

## Variables de entorno — Backend (Render)

Configurar en Render → Environment → Environment Variables:

```
APP_NAME=FarMedic
APP_ENV=production
APP_DEBUG=false
APP_KEY=<definir en el entorno>
APP_URL=https://farmedic.onrender.com

APP_LOCALE=es
APP_FALLBACK_LOCALE=es
APP_FAKER_LOCALE=es_EC

LOG_CHANNEL=stderr
LOG_LEVEL=error

DB_CONNECTION=pgsql
DB_HOST=<definir en el entorno>
DB_PORT=5432
DB_DATABASE=neondb
DB_USERNAME=<definir en el entorno>
DB_PASSWORD=<definir en el entorno>
DB_SSLMODE=require

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=true

CACHE_STORE=database
QUEUE_CONNECTION=sync
FILESYSTEM_DISK=local

GOOGLE_CLIENT_ID=<ver Google Cloud Console → FarMedic → OAuth 2.0 Client IDs>
GOOGLE_CLIENT_SECRET=<ver Google Cloud Console → FarMedic → OAuth 2.0 Client IDs>
GOOGLE_REDIRECT_URI=https://farmedic.onrender.com/auth/google/callback

FRONTEND_URL=https://far-medic.vercel.app
SANCTUM_STATEFUL_DOMAINS=far-medic.vercel.app
```

## Variables de entorno — Frontend (Vercel)

Configurar en Vercel → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://farmedic.onrender.com
```

---

## Flujo de deploy (automático)

```
git push origin main
  ├── Vercel detecta cambio en Frontend/ → rebuild + deploy (~1 min)
  └── Render detecta cambio → rebuild Docker + restart (~5 min)
         └── start.sh: migrate --force → db:seed --force → config:cache → supervisord
```

El seed es **idempotente** (upsert / firstOrCreate). Seguro de ejecutar en cada deploy.

---

## Google OAuth — Configuración en Google Cloud Console

- Proyecto: `FarMedic`
- URI de redirección autorizados:
  - `https://farmedic.onrender.com/auth/google/callback` ← producción
  - `http://localhost:8000/auth/google/callback` ← desarrollo local
- Pantalla de consentimiento: modo Testing
- Usuarios de prueba: `chaloromerov3@gmail.com`

---

## Desarrollo local

### Backend (Laravel, puerto 8000)
```powershell
cd Backend
cp .env.example .env          # primera vez
php artisan key:generate      # primera vez
php artisan migrate --seed    # primera vez
php artisan serve --port=8000
```

### Frontend (Next.js, puerto 3000)
```powershell
cd Frontend
npm install                   # primera vez
npm run dev
```

En desarrollo, el frontend hace proxy automático a `http://127.0.0.1:8000` para `/api/*` y `/auth/google/*` (configurado en `next.config.ts`).

### Túnel (opcional — expone localhost con dominio público)
```powershell
cloudflared tunnel run far-medic
```

---

## Datos iniciales (seed)

El seeder crea automáticamente:

| Entidad | Detalle |
|---------|---------|
| Roles | administrador · empleado · cliente |
| Farmacia | FarMedic (RUC 1791234567001) |
| Sucursales | Matriz (Riobamba) · Sucursal Guano |
| Admin | `admin@farmedic.local` / contraseña de `SEED_ADMIN_PASSWORD` (variable de entorno) |
| Categorías | 8 categorías farmacéuticas |
| Proveedores | Difare S.A. · DYVENPRO · Leterago del Ecuador |
| Medicamentos | 76 en Matriz · ~33 en Sucursal Guano (catálogo, **sin stock**) |

`db:seed` (que corre en cada deploy) **no crea lotes**. El stock de demostración es opcional y se carga a mano:

```bash
php artisan db:seed --class=LotesDemoSeeder   # 1 lote por medicamento + su movimiento 'ingreso' en el Kardex
```

Incluye lotes vigentes, próximos a vencer y vencidos. Es idempotente (omite medicamentos que ya tienen lotes).

---

## Lógica de números de lote

Formato: `{PREFIX}-{YYYYMM}-{NNN}`

| Campo | Descripción |
|-------|-------------|
| `PREFIX` | `FM` = Matriz Riobamba · `FG` = Sucursal Guano |
| `YYYYMM` | Año-mes de fabricación aproximado (vencimiento − 2 años) |
| `NNN` | Secuencia de 3 dígitos, única dentro del prefix |

Ejemplos: `FM-202501-001` (Paracetamol 500 mg, Matriz) · `FG-202501-001` (mismo producto, Guano)

Lotes de prueba incluidos intencionalmente:
- `FM-202501-006` vence `2026-09-30` → **próximo a vencer** (~90 días)
- `FM-202503-018` vence `2026-08-31` → **próximo a vencer** (~60 días)
- `FM-202412-020` vence `2026-04-30` → **vencido** (para probar alertas)

---

## Reseteo operativo (punto cero con catálogo)

Deja el sistema sin datos transaccionales pero con roles, farmacia, sucursales, admin, categorías, proveedores y medicamentos (sin lotes ni stock).

```bash
php artisan migrate:fresh --seed --force
```

**Destruye todos los datos** (ventas, pedidos, lotes, movimientos, usuarios distintos del admin, tokens). Después hay que rotar la contraseña del admin.
En producción se ejecuta contra Neon desde una máquina con acceso (variables `DB_*` de Neon en el entorno) o desde el Shell de Render; Vercel no interviene. Hacer un `pg_dump` antes.

---

## Pendientes conocidos

- Hora inconsistente en panel administrador (zona horaria `America/Guayaquil`)
- Pedidos entregados no aparecen en módulo de ventas
- Rutas de descarga de comprobantes PDF a revisar en producción
