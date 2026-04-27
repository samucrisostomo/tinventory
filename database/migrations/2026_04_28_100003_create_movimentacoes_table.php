<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('movimentacoes', function (Blueprint $table) {
            $table->id();
            $table->string('tipo', 32)->default('entrada_lote');
            $table->string('condicao_entrada', 64);
            $table->foreignId('estoque_id')
                ->constrained('estoques')
                ->restrictOnDelete();
            $table->foreignId('nota_fiscal_id')
                ->nullable()
                ->constrained('notas_fiscais')
                ->nullOnDelete();
            $table->foreignId('user_id')
                ->constrained('users')
                ->restrictOnDelete();
            $table->text('observacao')->nullable();
            $table->decimal('total_quantidade', 18, 4)->default(0);
            $table->decimal('total_valor', 18, 2)->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('movimentacoes');
    }
};
