#!/bin/sh
set -e

php artisan migrate --force
php artisan db:seed --force
# RS-11: el contenedor no corre el scheduler (solo php-fpm y nginx); se poda en cada arranque.
php artisan sanctum:prune-expired --hours=24 || true
php artisan config:cache
php artisan route:cache

exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
