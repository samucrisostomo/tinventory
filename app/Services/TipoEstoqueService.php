<?php

namespace App\Services;

use App\Models\TipoEstoque;
use Illuminate\Database\Eloquent\Collection;

class TipoEstoqueService
{
    public function list(): Collection
    {
        return TipoEstoque::query()
            ->select([
                'id',
                'codigo',
                'descricao',
                'ativo',
                'created_at',
                'updated_at',
            ])
            ->latest()
            ->get();
    }

    public function create(array $data): TipoEstoque
    {
        return TipoEstoque::create($data);
    }

    public function update(TipoEstoque $tipoEstoque, array $data): void
    {
        $tipoEstoque->update($data);
    }

    public function toggleStatus(TipoEstoque $tipoEstoque): void
    {
        $tipoEstoque->update([
            'ativo' => ! $tipoEstoque->ativo,
        ]);
    }

    public function delete(TipoEstoque $tipoEstoque): void
    {
        $tipoEstoque->delete();
    }
}
