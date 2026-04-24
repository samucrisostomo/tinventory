<?php

namespace App\Services;

use App\Models\TipoColaborador;
use Illuminate\Database\Eloquent\Collection;

class TipoColaboradorService
{
    public function list(): Collection
    {
        return TipoColaborador::query()
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

    public function create(array $data): TipoColaborador
    {
        return TipoColaborador::create($data);
    }

    public function update(TipoColaborador $tipoColaborador, array $data): void
    {
        $tipoColaborador->update($data);
    }

    public function toggleStatus(TipoColaborador $tipoColaborador): void
    {
        $tipoColaborador->update([
            'ativo' => ! $tipoColaborador->ativo,
        ]);
    }

    public function delete(TipoColaborador $tipoColaborador): void
    {
        $tipoColaborador->delete();
    }
}
