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
            $table->string('matricula')->nullable()->change();
            $table->string('cpf', 11)->nullable()->change();
            $table->foreignId('empresa_id')->nullable()->change();
            $table->foreignId('local_id')->nullable()->change();
            $table->date('data_admissao')->nullable()->change();
            $table->foreignId('situacao_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('colaboradores', function (Blueprint $table) {
            $table->string('matricula')->nullable(false)->change();
            $table->string('cpf', 11)->nullable(false)->change();
            $table->foreignId('empresa_id')->nullable(false)->change();
            $table->foreignId('local_id')->nullable(false)->change();
            $table->date('data_admissao')->nullable(false)->change();
            $table->foreignId('situacao_id')->nullable(false)->change();
        });
    }
};
