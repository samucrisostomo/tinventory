<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('movimentacao_itens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('movimentacao_id')
                ->constrained('movimentacoes')
                ->cascadeOnDelete();
            $table->foreignId('material_id')
                ->constrained('materiais')
                ->restrictOnDelete();
            $table->foreignId('empresa_id')
                ->nullable()
                ->constrained('empresas')
                ->nullOnDelete();
            $table->foreignId('local_id')
                ->nullable()
                ->constrained('locais')
                ->nullOnDelete();
            $table->decimal('quantidade', 18, 4);
            $table->decimal('valor_unitario', 18, 2);
            $table->text('observacao')->nullable();
            $table->json('anexos')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('movimentacao_itens');
    }
};
