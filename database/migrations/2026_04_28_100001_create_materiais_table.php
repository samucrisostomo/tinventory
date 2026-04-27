<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('materiais', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tipo_material_id')
                ->constrained('tipos_materiais')
                ->restrictOnDelete();
            $table->foreignId('marca_id')
                ->constrained('marcas')
                ->restrictOnDelete();
            $table->string('nome');
            $table->decimal('quantidade_estoque', 18, 4)->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tipo_material_id', 'marca_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('materiais');
    }
};
