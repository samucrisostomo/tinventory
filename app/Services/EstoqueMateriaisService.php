<?php

namespace App\Services;

use App\Models\Estoque;
use App\Models\ItemEstoque;
use App\Models\MovimentacaoItem;
use Illuminate\Support\Facades\Storage;

class EstoqueMateriaisService
{
    /**
     * @return array<string, mixed>
     */
    public function montarPagina(Estoque $estoque): array
    {
        $itensEstoque = ItemEstoque::query()
            ->with([
                'material:id,tipo_material_id,marca_id,nome',
                'material.tipoMaterial:id,nome,rastreavel',
                'material.marca:id,nome',
            ])
            ->where('estoque_id', $estoque->id)
            ->orderBy('material_id')
            ->get();

        $materialIds = $itensEstoque
            ->pluck('material_id')
            ->filter()
            ->unique()
            ->values();

        $ultimasMovimentacoes = $this->buscarUltimaMovimentacaoPorMaterial(
            $estoque->id,
            $materialIds->all(),
        );

        $materiais = $itensEstoque->map(function (ItemEstoque $itemEstoque) use ($ultimasMovimentacoes) {
            $material = $itemEstoque->material;
            $tipoMaterial = $material?->tipoMaterial;
            $movimentacaoItem = $ultimasMovimentacoes[(int) $itemEstoque->material_id] ?? null;

            $documentos = $this->mapearDocumentos($movimentacaoItem?->anexos);
            $condicao = $movimentacaoItem?->movimentacao?->condicao_entrada ?? '-';

            return [
                'id' => $itemEstoque->id,
                'material_id' => (int) $itemEstoque->material_id,
                'codigo' => sprintf('MAT-%04d', (int) $itemEstoque->material_id),
                'descricao' => $material?->nome ?? '-',
                'condicao' => $condicao,
                'quantidade' => (float) $itemEstoque->quantidade,
                'local' => $movimentacaoItem?->local?->nome ?? $estoque->local?->nome ?? '-',
                'empresa' => $movimentacaoItem?->empresa?->nome ?? $estoque->empresa?->nome ?? '-',
                'numero_serie' => $movimentacaoItem?->numero_serie ?: '-',
                'unidade' => $tipoMaterial?->nome ?? '-',
                'rastreavel' => (bool) ($tipoMaterial?->rastreavel ?? false),
                'documentos' => $documentos,
            ];
        })->values();

        $totalItens = (float) $itensEstoque->sum(
            fn (ItemEstoque $item) => (float) $item->quantidade,
        );
        $itensRastreaveis = (float) $materiais
            ->filter(fn (array $item) => $item['rastreavel'] === true)
            ->sum(fn (array $item) => (float) $item['quantidade']);

        return [
            'indicadores' => [
                'total_materiais' => $materiais->count(),
                'total_itens' => $totalItens,
                'itens_rastreaveis' => $itensRastreaveis,
            ],
            'materiais' => $materiais,
            'filtros' => [
                'locais' => $materiais->pluck('local')->filter()->unique()->values(),
                'empresas' => $materiais->pluck('empresa')->filter()->unique()->values(),
                'condicoes' => $materiais->pluck('condicao')->filter()->unique()->values(),
            ],
        ];
    }

    /**
     * @param  array<int>  $materialIds
     * @return array<int, MovimentacaoItem>
     */
    private function buscarUltimaMovimentacaoPorMaterial(int $estoqueId, array $materialIds): array
    {
        if ($materialIds === []) {
            return [];
        }

        $itens = MovimentacaoItem::query()
            ->with([
                'movimentacao:id,estoque_id,condicao_entrada',
                'empresa:id,nome',
                'local:id,nome',
            ])
            ->whereIn('material_id', $materialIds)
            ->whereHas('movimentacao', fn ($query) => $query->where('estoque_id', $estoqueId))
            ->orderByDesc('created_at')
            ->get();

        $map = [];
        foreach ($itens as $item) {
            $materialId = (int) $item->material_id;
            if (! isset($map[$materialId])) {
                $map[$materialId] = $item;
            }
        }

        return $map;
    }

    /**
     * @param  array<string, mixed>|null  $anexos
     * @return array<int, array<string, string>>
     */
    private function mapearDocumentos(?array $anexos): array
    {
        if (! is_array($anexos) || $anexos === []) {
            return [];
        }

        $documentos = [];

        $termo = $anexos['termo_recebimento'] ?? null;
        if (is_string($termo) && $termo !== '') {
            $documentos[] = [
                'nome' => 'Termo de recebimento',
                'url' => Storage::url($termo),
            ];
        }

        $fotos = $anexos['fotos'] ?? [];
        if (is_array($fotos)) {
            foreach ($fotos as $index => $foto) {
                if (! is_string($foto) || $foto === '') {
                    continue;
                }

                $documentos[] = [
                    'nome' => 'Foto '.($index + 1),
                    'url' => Storage::url($foto),
                ];
            }
        }

        return $documentos;
    }
}

