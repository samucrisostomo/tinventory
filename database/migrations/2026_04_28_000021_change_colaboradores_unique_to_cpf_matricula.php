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
        Schema::table('colaboradores', function (Blueprint $table) {
            $table->dropUnique('colaboradores_cpf_unique');
            $table->unique(['cpf', 'matricula'], 'colaboradores_cpf_matricula_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('colaboradores', function (Blueprint $table) {
            $table->dropUnique('colaboradores_cpf_matricula_unique');
            $table->unique('cpf', 'colaboradores_cpf_unique');
        });
    }
};
