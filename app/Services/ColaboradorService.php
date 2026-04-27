<?php

namespace App\Services;

use App\Models\Colaborador;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class ColaboradorService
{
    public function __construct(
        private readonly EstoqueService $estoqueService,
    ) {}

    public function list(): Collection
    {
        return Colaborador::query()
            ->select([
                'id',
                'nome',
                'tipo_colaborador_id',
                'matricula',
                'cpf',
                'empresa_id',
                'local_id',
                'data_admissao',
                'data_afastamento',
                'situacao_id',
                'created_at',
                'updated_at',
            ])
            ->with([
                'tipoColaborador:id,nome',
                'empresa:id,nome',
                'local:id,nome,codigo,empresa_id',
                'situacaoColaborador:id,nome',
            ])
            ->latest()
            ->get();
    }

    public function create(array $data): Colaborador
    {
        return DB::transaction(function () use ($data) {
            $colaborador = Colaborador::create($data);
            $this->estoqueService->createDefaultForColaborador($colaborador);

            return $colaborador;
        });
    }

    public function update(Colaborador $colaborador, array $data): void
    {
        $colaborador->update($data);
    }

    public function delete(Colaborador $colaborador): void
    {
        $colaborador->delete();
    }
}
