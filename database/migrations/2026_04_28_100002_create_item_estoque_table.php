<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('item_estoque', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estoque_id')
                ->constrained('estoques')
                ->restrictOnDelete();
            $table->foreignId('material_id')
                ->constrained('materiais')
                ->restrictOnDelete();
            $table->decimal('quantidade', 18, 4)->default(0);
            $table->timestamps();

            $table->unique(['estoque_id', 'material_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_estoque');
    }
};
