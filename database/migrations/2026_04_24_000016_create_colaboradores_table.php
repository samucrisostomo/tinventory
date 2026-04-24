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
        Schema::create('colaboradores', function (Blueprint $table) {
            $table->id();
            $table->string('nome');
            $table->foreignId('tipo_colaborador_id')
                ->constrained('tipos_colaborador')
                ->restrictOnDelete();
            $table->string('matricula');
            $table->string('cpf', 11);
            $table->foreignId('empresa_id')
                ->constrained('empresas')
                ->restrictOnDelete();
            $table->foreignId('local_id')
                ->constrained('locais')
                ->restrictOnDelete();
            $table->date('data_admissao');
            $table->date('data_afastamento')->nullable();
            $table->foreignId('situacao_id')
                ->constrained('situacoes_colaborador')
                ->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique('cpf');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('colaboradores');
    }
};
