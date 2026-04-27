<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notas_fiscais', function (Blueprint $table) {
            $table->id();
            $table->string('numero');
            $table->date('data_emissao')->nullable();
            $table->foreignId('fornecedor_id')
                ->nullable()
                ->constrained('fornecedores')
                ->nullOnDelete();
            $table->string('arquivo_path')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notas_fiscais');
    }
};
