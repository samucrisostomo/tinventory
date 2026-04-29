<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transferencia_itens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transferencia_id')
                ->constrained('transferencias')
                ->cascadeOnDelete();
            $table->foreignId('material_id')
                ->constrained('materiais')
                ->restrictOnDelete();
            $table->foreignId('movimentacao_item_origem_id')
                ->nullable()
                ->constrained('movimentacao_itens')
                ->nullOnDelete();
            $table->foreignId('empresa_id')
                ->nullable()
                ->constrained('empresas')
                ->nullOnDelete();
            $table->foreignId('local_id')
                ->nullable()
                ->constrained('locais')
                ->nullOnDelete();
            $table->string('numero_serie')->nullable();
            $table->string('condicao', 64)->nullable();
            $table->decimal('quantidade', 18, 4);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transferencia_itens');
    }
};

