<?php

namespace App\Services;

use App\Models\Estoque;
use App\Models\ItemEstoque;
use App\Models\MovimentacaoItem;

class TransferenciaEstoqueService
{
    /**
     * @return array<string, mixed>
     */
    public function montarPagina(): array
    {
        $estoques = Estoque::query()
            ->select(['id', 'nome', 'empresa_id', 'local_id'])
            ->with([
                'empresa:id,nome',
                'local:id,nome,codigo',
            ])
            ->orderBy('nome')
            ->get();

        $itensPorEstoque = ItemEstoque::query()
            ->select(['id', 'estoque_id', 'material_id', 'quantidade'])
            ->with([
                'material:id,nome',
            ])
            ->where('quantidade', '>', 0)
            ->whereIn('estoque_id', $estoques->pluck('id'))
            ->orderBy('estoque_id')
            ->get();

        $materialIds = $itensPorEstoque->pluck('material_id')->filter()->unique()->values();
        $estoqueIds = $estoques->pluck('id')->values();

        $movimentacoes = MovimentacaoItem::query()
            ->select([
                'id',
                'movimentacao_id',
                'material_id',
                'empresa_id',
                'local_id',
                'numero_serie',
            ])
            ->with([
                'movimentacao:id,estoque_id,condicao_entrada',
                'empresa:id,nome',
                'local:id,nome',
            ])
            ->whereIn('material_id', $materialIds)
            ->whereHas('movimentacao', fn ($query) => $query->whereIn('estoque_id', $estoqueIds))
            ->orderByDesc('created_at')
            ->get();

        $vinculosPorChave = [];

        foreach ($movimentacoes as $movimentacaoItem) {
            $estoqueId = $movimentacaoItem->movimentacao?->estoque_id;
            $materialId = $movimentacaoItem->material_id;

            if (! $estoqueId || ! $materialId) {
                continue;
            }

            $chave = "{$estoqueId}:{$materialId}";
            $assinatura = implode('|', [
                (string) ($movimentacaoItem->numero_serie ?? ''),
                (string) ($movimentacaoItem->local_id ?? ''),
                (string) ($movimentacaoItem->empresa_id ?? ''),
                (string) ($movimentacaoItem->movimentacao?->condicao_entrada ?? ''),
            ]);

            $vinculosPorChave[$chave] ??= [];

            if (isset($vinculosPorChave[$chave][$assinatura])) {
                continue;
            }

            $vinculosPorChave[$chave][$assinatura] = [
                'id' => (int) $movimentacaoItem->id,
                'numero_serie' => $movimentacaoItem->numero_serie ?: null,
                'local_id' => $movimentacaoItem->local_id ? (int) $movimentacaoItem->local_id : null,
                'local_nome' => $movimentacaoItem->local?->nome ?? null,
                'empresa_id' => $movimentacaoItem->empresa_id ? (int) $movimentacaoItem->empresa_id : null,
                'empresa_nome' => $movimentacaoItem->empresa?->nome ?? null,
                'condicao' => $movimentacaoItem->movimentacao?->condicao_entrada ?? null,
            ];
        }

        $materiaisPorEstoque = [];

        foreach ($itensPorEstoque as $itemEstoque) {
            $estoqueId = (int) $itemEstoque->estoque_id;
            $materialId = (int) $itemEstoque->material_id;
            $chave = "{$estoqueId}:{$materialId}";

            $vinculos = array_values($vinculosPorChave[$chave] ?? []);

            if ($vinculos === []) {
                $vinculos = [[
                    'id' => 0,
                    'numero_serie' => null,
                    'local_id' => null,
                    'local_nome' => null,
                    'empresa_id' => null,
                    'empresa_nome' => null,
                    'condicao' => null,
                ]];
            }

            $materiaisPorEstoque[(string) $estoqueId] ??= [];
            $materiaisPorEstoque[(string) $estoqueId][] = [
                'material_id' => $materialId,
                'codigo' => sprintf('MAT-%04d', $materialId),
                'descricao' => $itemEstoque->material?->nome ?? '-',
                'quantidade_disponivel' => (float) $itemEstoque->quantidade,
                'vinculos' => $vinculos,
            ];
        }

        return [
            'estoques' => $estoques,
            'materiaisPorEstoque' => $materiaisPorEstoque,
        ];
    }
}

