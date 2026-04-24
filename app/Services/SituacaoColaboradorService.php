<?php

namespace App\Services;

use App\Models\SituacaoColaborador;
use Illuminate\Database\Eloquent\Collection;

class SituacaoColaboradorService
{
    public function list(): Collection
    {
        return SituacaoColaborador::query()
            ->select([
                'id',
                'nome',
                'descricao',
                'ativo',
                'created_at',
                'updated_at',
            ])
            ->latest()
            ->get();
    }

    public function create(array $data): SituacaoColaborador
    {
        return SituacaoColaborador::create($data);
    }

    public function update(SituacaoColaborador $situacaoColaborador, array $data): void
    {
        $situacaoColaborador->update($data);
    }

    public function toggleStatus(SituacaoColaborador $situacaoColaborador): void
    {
        $situacaoColaborador->update([
            'ativo' => ! $situacaoColaborador->ativo,
        ]);
    }

    public function delete(SituacaoColaborador $situacaoColaborador): void
    {
        $situacaoColaborador->delete();
    }
}
