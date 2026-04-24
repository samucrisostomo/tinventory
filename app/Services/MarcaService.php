<?php

namespace App\Services;

use App\Models\Marca;
use Illuminate\Database\Eloquent\Collection;

class MarcaService
{
    public function list(): Collection
    {
        return Marca::query()
            ->select([
                'id',
                'nome',
                'descricao',
                'tipo_material_id',
                'ativo',
                'created_at',
                'updated_at',
            ])
            ->with(['tipoMaterial:id,nome'])
            ->latest()
            ->get();
    }

    public function create(array $data): Marca
    {
        return Marca::create($data);
    }

    public function update(Marca $marca, array $data): void
    {
        $marca->update($data);
    }

    public function toggleStatus(Marca $marca): void
    {
        $marca->update([
            'ativo' => ! $marca->ativo,
        ]);
    }

    public function delete(Marca $marca): void
    {
        $marca->delete();
    }
}
