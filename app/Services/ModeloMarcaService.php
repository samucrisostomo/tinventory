<?php

namespace App\Services;

use App\Models\ModeloMarca;
use Illuminate\Database\Eloquent\Collection;

class ModeloMarcaService
{
    public function list(): Collection
    {
        return ModeloMarca::query()
            ->select([
                'id',
                'marcas_id',
                'descricao',
                'ativo',
                'created_at',
                'updated_at',
                'deleted_at',
            ])
            ->with(['marca:id,nome'])
            ->latest()
            ->get();
    }

    public function create(array $data): ModeloMarca
    {
        return ModeloMarca::create($data);
    }

    public function update(ModeloMarca $modeloMarca, array $data): void
    {
        $modeloMarca->update($data);
    }

    public function toggleStatus(ModeloMarca $modeloMarca): void
    {
        $modeloMarca->update([
            'ativo' => ! $modeloMarca->ativo,
        ]);
    }

    public function delete(ModeloMarca $modeloMarca): void
    {
        $modeloMarca->delete();
    }
}
