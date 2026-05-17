<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sucursales', function (Blueprint $table) {
            // Coordenadas opcionales. Decimal con precision para Ecuador (rango ~ -5..+1 lat, -81..-75 lng).
            // 10,7 ≈ centímetros de precisión — suficiente para geolocalización de locales.
            $table->decimal('latitud', 10, 7)->nullable()->after('direccion');
            $table->decimal('longitud', 10, 7)->nullable()->after('latitud');
        });
    }

    public function down(): void
    {
        Schema::table('sucursales', function (Blueprint $table) {
            $table->dropColumn(['latitud', 'longitud']);
        });
    }
};
