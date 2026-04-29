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
        Schema::table('materiais', function (Blueprint $table) {
            $table->foreignId('modelo_marca_id')
                ->nullable()
                ->after('marca_id')
                ->constrained('modelos_marcas')
                ->restrictOnDelete();
                
            $table->dropUnique(['tipo_material_id', 'marca_id']);
            $table->unique(['tipo_material_id', 'marca_id', 'modelo_marca_id'], 'mat_tipo_marca_modelo_unq');
        });
    }

    public function down(): void
    {
        Schema::table('materiais', function (Blueprint $table) {
            $table->dropUnique('mat_tipo_marca_modelo_unq');
            $table->dropForeign(['modelo_marca_id']);
            $table->dropColumn('modelo_marca_id');
            $table->unique(['tipo_material_id', 'marca_id']);
        });
    }
};
