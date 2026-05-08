# FarMedic — Backend

**Stack**: Laravel 11+ · PHP 8.2+ · PostgreSQL · Sanctum · Socialite

> Snapshot — fuente de verdad en vault Obsidian.

## Setup
```bash
# Scaffolding (solo primera vez)
composer create-project laravel/laravel Backend
cd Backend
composer require laravel/sanctum laravel/socialite

# Desarrollo
php artisan serve

# Migraciones
php artisan migrate
```

## Variables de entorno
Copiar `Backend/.env.example` → `Backend/.env` y configurar:
```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=farmedic
DB_USERNAME=
DB_PASSWORD=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

SANCTUM_STATEFUL_DOMAINS=localhost:3000
```

## Estructura clave
```
Backend/
├── app/
│   ├── Http/Controllers/
│   ├── Models/
│   └── Policies/
├── database/migrations/
└── routes/api.php
```

## Multi-tenancy
Todo modelo operativo incluye `sucursal_id`. Ver vault → `domain/farmacia.md`.
