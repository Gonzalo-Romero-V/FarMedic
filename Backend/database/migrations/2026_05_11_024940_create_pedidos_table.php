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
        Schema::create('pedidos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sucursal_id')->constrained('sucursales')->restrictOnDelete();
            $table->foreignId('cliente_id')->constrained('usuarios')->restrictOnDelete();
            $table->foreignId('usuario_id_gestor')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->foreignId('receta_id')->nullable()->constrained('recetas')->nullOnDelete();
            $table->string('numero_pedido');
            $table->enum('tipo_entrega', ['retiro_local', 'domicilio']);
            $table->string('direccion_envio')->nullable();
            $table->string('telefono_contacto');
            $table->enum('estado', ['pendiente', 'en_camino', 'entregado', 'cancelado'])->default('pendiente');
            $table->decimal('subtotal', 10, 2);
            $table->decimal('iva_tasa_aplicada', 5, 2);
            $table->decimal('impuesto_total', 10, 2);
            $table->decimal('total', 10, 2);
            $table->timestamp('fecha_solicitud');
            $table->timestamp('fecha_envio')->nullable();
            $table->timestamp('fecha_entrega')->nullable();
            $table->timestamps();

            $table->unique(['sucursal_id', 'numero_pedido']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pedidos');
    }
};
