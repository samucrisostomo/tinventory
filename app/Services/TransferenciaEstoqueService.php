<?php

namespace App\Services;

use App\Models\Estoque;
use App\Models\ItemEstoque;
use App\Models\MovimentacaoItem;
use App\Models\Transferencia;
use App\Models\TransferenciaItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

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
            'transferenciasRecentes' => Transferencia::query()
                ->select([
                    'id',
                    'estoque_origem_id',
                    'estoque_destino_id',
                    'user_id',
                    'termo_recebimento_path',
                    'observacao',
                    'total_itens',
                    'created_at',
                ])
                ->with([
                    'estoqueOrigem:id,nome',
                    'estoqueDestino:id,nome',
                    'user:id,name',
                    'itens:id,transferencia_id,material_id,empresa_id,local_id,numero_serie,condicao,quantidade',
                    'itens.material:id,nome',
                    'itens.empresa:id,nome',
                    'itens.local:id,nome',
                ])
                ->latest()
                ->limit(30)
                ->get()
                ->map(fn (Transferencia $transferencia) => [
                    'id' => $transferencia->id,
                    'estoque_origem' => $transferencia->estoqueOrigem?->nome ?? '-',
                    'estoque_destino' => $transferencia->estoqueDestino?->nome ?? '-',
                    'usuario' => $transferencia->user?->name ?? '-',
                    'total_itens' => (float) $transferencia->total_itens,
                    'observacao' => $transferencia->observacao,
                    'termo_url' => $transferencia->termo_recebimento_path
                        ? Storage::url($transferencia->termo_recebimento_path)
                        : null,
                    'created_at' => $transferencia->created_at?->toISOString(),
                    'itens' => $transferencia->itens
                        ->map(fn (TransferenciaItem $item) => [
                            'id' => $item->id,
                            'material' => $item->material?->nome ?? '-',
                            'empresa' => $item->empresa?->nome,
                            'local' => $item->local?->nome,
                            'numero_serie' => $item->numero_serie,
                            'condicao' => $item->condicao,
                            'quantidade' => (float) $item->quantidade,
                        ])
                        ->values(),
                ])
                ->values(),
        ];
    }

    public function criarTransferencia(Request $request): Transferencia
    {
        return DB::transaction(function () use ($request) {
            $termoPath = null;

            if ($request->hasFile('termo_recebimento')) {
                $termoPath = $request->file('termo_recebimento')->store('transferencias/termos', 'public');
            }

            $itens = $request->input('itens', []);
            $totalQuantidade = 0.0;
            foreach ($itens as $item) {
                $totalQuantidade += (float) ($item['quantidade'] ?? 0);
            }

            $transferencia = Transferencia::query()->create([
                'estoque_origem_id' => (int) $request->input('estoque_origem_id'),
                'estoque_destino_id' => (int) $request->input('estoque_destino_id'),
                'user_id' => (int) $request->user()->id,
                'termo_recebimento_path' => $termoPath,
                'observacao' => $request->filled('observacao') ? (string) $request->input('observacao') : null,
                'total_itens' => $totalQuantidade,
            ]);

            foreach ($itens as $item) {
                $materialId = (int) $item['material_id'];
                $quantidade = (float) $item['quantidade'];

                TransferenciaItem::query()->create([
                    'transferencia_id' => $transferencia->id,
                    'material_id' => $materialId,
                    'movimentacao_item_origem_id' => isset($item['movimentacao_item_origem_id']) && $item['movimentacao_item_origem_id'] !== ''
                        ? (int) $item['movimentacao_item_origem_id']
                        : null,
                    'empresa_id' => isset($item['empresa_id']) && $item['empresa_id'] !== ''
                        ? (int) $item['empresa_id']
                        : null,
                    'local_id' => isset($item['local_id']) && $item['local_id'] !== ''
                        ? (int) $item['local_id']
                        : null,
                    'numero_serie' => ! empty($item['numero_serie']) ? (string) $item['numero_serie'] : null,
                    'condicao' => ! empty($item['condicao']) ? (string) $item['condicao'] : null,
                    'quantidade' => $quantidade,
                ]);

                $itemOrigem = ItemEstoque::query()->firstOrCreate(
                    [
                        'estoque_id' => (int) $request->input('estoque_origem_id'),
                        'material_id' => $materialId,
                    ],
                    ['quantidade' => 0],
                );
                $itemDestino = ItemEstoque::query()->firstOrCreate(
                    [
                        'estoque_id' => (int) $request->input('estoque_destino_id'),
                        'material_id' => $materialId,
                    ],
                    ['quantidade' => 0],
                );

                $itemOrigem->decrement('quantidade', $quantidade);
                $itemDestino->increment('quantidade', $quantidade);
            }

            return $transferencia->fresh(['itens', 'estoqueOrigem', 'estoqueDestino', 'user']);
        });
    }
}

