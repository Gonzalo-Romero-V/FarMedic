<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('medicamentos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sucursal_id')->constrained('sucursales')->restrictOnDelete();
            $table->foreignId('categoria_id')->constrained('categorias')->restrictOnDelete();
            $table->foreignId('proveedor_id')->constrained('proveedores')->restrictOnDelete();
            $table->string('nombre_comercial')->index();
            $table->string('principio_activo')->index();
            $table->string('codigo_barras')->nullable();
            $table->decimal('precio', 10, 2);
            $table->integer('stock_minimo');
            $table->string('ubicacion_fisica');
            $table->boolean('requiere_receta')->default(false);
            $table->boolean('activo')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->unique(['sucursal_id', 'codigo_barras']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medicamentos');
    }
};
