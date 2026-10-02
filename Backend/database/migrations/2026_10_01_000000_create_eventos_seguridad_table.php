<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * RS-15. Bitácora de eventos de seguridad (autenticación y autorización).
 * Nunca guarda contraseñas ni tokens.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('eventos_seguridad', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->foreignId('objetivo_id')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->string('accion', 40);
            $table->string('resultado', 20);
            $table->string('ip', 45)->nullable();
            $table->string('agente', 255)->nullable();
            $table->string('detalle', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['accion', 'created_at']);
            $table->index('usuario_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('eventos_seguridad');
    }
};
