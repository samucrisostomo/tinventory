<?php

use App\Models\TipoEstoque;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Garante o tipo de estoque usado para estoques automáticos de colaborador.
     */
    public function up(): void
    {
        $tipo = TipoEstoque::withTrashed()->updateOrCreate(
            ['codigo' => TipoEstoque::CODIGO_COLABORADOR],
            [
                'descricao' => 'Estoque padrão vinculado a colaboradores',
                'ativo' => true,
            ],
        );

        if (method_exists($tipo, 'trashed') && $tipo->trashed()) {
            $tipo->restore();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        TipoEstoque::withTrashed()
            ->where('codigo', TipoEstoque::CODIGO_COLABORADOR)
            ->delete();
    }
};
