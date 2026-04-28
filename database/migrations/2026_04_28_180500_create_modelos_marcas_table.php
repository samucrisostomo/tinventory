<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('modelos_marcas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('marcas_id')
                ->constrained('marcas')
                ->restrictOnDelete();
            $table->string('descricao');
            $table->boolean('ativo')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('modelos_marcas');
    }
};
