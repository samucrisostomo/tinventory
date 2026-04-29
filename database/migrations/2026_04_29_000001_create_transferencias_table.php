<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transferencias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estoque_origem_id')
                ->constrained('estoques')
                ->restrictOnDelete();
            $table->foreignId('estoque_destino_id')
                ->constrained('estoques')
                ->restrictOnDelete();
            $table->foreignId('user_id')
                ->constrained('users')
                ->restrictOnDelete();
            $table->string('termo_recebimento_path')->nullable();
            $table->text('observacao')->nullable();
            $table->decimal('total_itens', 18, 4)->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transferencias');
    }
};

