<?php

namespace App\Services;

use App\Models\Colaborador;
use App\Models\Estoque;
use App\Models\TipoEstoque;
use Illuminate\Database\Eloquent\Collection;
use RuntimeException;

class EstoqueService
{
    public function list(): Collection
    {
        return Estoque::query()
            ->select([
                'id',
                'nome',
                'tipos_estoque_id',
                'colaborador_id',
                'empresa_id',
                'local_id',
                'created_at',
                'updated_at',
            ])
            ->with([
                'tipoEstoque:id,codigo,descricao',
                'colaborador:id,nome',
                'empresa:id,nome',
                'local:id,nome,codigo,empresa_id',
            ])
            ->latest()
            ->get();
    }

    public function create(array $data): Estoque
    {
        return Estoque::create($data);
    }

    /**
     * Cria o estoque padrão do colaborador (tipo COLABORADOR), após o cadastro do colaborador.
     */
    public function createDefaultForColaborador(Colaborador $colaborador): Estoque
    {
        $tipo = TipoEstoque::query()
            ->where('codigo', TipoEstoque::CODIGO_COLABORADOR)
            ->where('ativo', true)
            ->first();

        if (! $tipo) {
            throw new RuntimeException(
                'Tipo de estoque COLABORADOR não encontrado ou inativo. Execute as migrations.',
            );
        }

        return Estoque::create([
            'nome' => 'Estoque - '.$colaborador->nome,
            'tipos_estoque_id' => $tipo->id,
            'colaborador_id' => $colaborador->id,
            'empresa_id' => $colaborador->empresa_id,
            'local_id' => $colaborador->local_id,
        ]);
    }

    public function update(Estoque $estoque, array $data): void
    {
        $estoque->update($data);
    }

    public function delete(Estoque $estoque): void
    {
        $estoque->delete();
    }
}
