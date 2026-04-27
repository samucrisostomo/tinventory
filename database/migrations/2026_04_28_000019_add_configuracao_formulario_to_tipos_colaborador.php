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
        Schema::table('tipos_colaborador', function (Blueprint $table) {
            $table->json('configuracao_formulario')->nullable()->after('descricao');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tipos_colaborador', function (Blueprint $table) {
            $table->dropColumn('configuracao_formulario');
        });
    }
};
