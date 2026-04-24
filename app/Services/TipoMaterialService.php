<?php

namespace App\Services;

use App\Models\TipoMaterial;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;

class TipoMaterialService
{
    public function list(): Collection
    {
        return TipoMaterial::query()
            ->select([
                'id',
                'nome',
                'mascara',
                'descricao',
                'ativo',
                'rastreavel',
                'created_at',
            ])
            ->latest()
            ->get();
    }

    public function create(array $data): TipoMaterial
    {
        $data['mascara'] = $this->generateMaskFromName($data['nome']);

        return TipoMaterial::create($data);
    }

    public function update(TipoMaterial $tipoMaterial, array $data): void
    {
        $data['mascara'] = $this->generateMaskFromName($data['nome']);

        $tipoMaterial->update($data);
    }

    public function toggleStatus(TipoMaterial $tipoMaterial): void
    {
        $tipoMaterial->update([
            'ativo' => ! $tipoMaterial->ativo,
        ]);
    }

    public function delete(TipoMaterial $tipoMaterial): void
    {
        $tipoMaterial->delete();
    }

    public function generateMaskFromName(string $name): string
    {
        $sanitizedName = Str::upper(
            Str::ascii($name),
        );

        $lettersOnly = preg_replace('/[^A-Z]/', '', $sanitizedName) ?? '';
        $prefix = Str::padRight(Str::substr($lettersOnly, 0, 4), 4, 'X');

        return "{$prefix}-0000";
    }
}
