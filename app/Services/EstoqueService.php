<?php

namespace App\Services;

use App\Models\Estoque;
use Illuminate\Database\Eloquent\Collection;

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

    public function update(Estoque $estoque, array $data): void
    {
        $estoque->update($data);
    }

    public function delete(Estoque $estoque): void
    {
        $estoque->delete();
    }
}
