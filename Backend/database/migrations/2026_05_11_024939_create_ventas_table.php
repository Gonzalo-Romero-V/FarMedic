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
        Schema::create('ventas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sucursal_id')->constrained('sucursales')->restrictOnDelete();
            $table->foreignId('usuario_id')->constrained('usuarios')->restrictOnDelete();
            $table->foreignId('cliente_id')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->foreignId('receta_id')->nullable()->constrained('recetas')->nullOnDelete();
            $table->string('numero_comprobante');
            $table->decimal('subtotal', 10, 2);
            $table->decimal('descuento_total', 10, 2)->default(0);
            $table->decimal('iva_tasa_aplicada', 5, 2);
            $table->decimal('impuesto_total', 10, 2);
            $table->decimal('total', 10, 2);
            $table->enum('metodo_pago', ['efectivo', 'tarjeta', 'transferencia']);
            $table->enum('estado', ['completada', 'anulada'])->default('completada');
            $table->string('comprobante_pdf_url')->nullable();
            $table->timestamp('fecha');
            $table->timestamps();

            $table->unique(['sucursal_id', 'numero_comprobante']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ventas');
    }
};
