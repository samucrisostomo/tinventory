<?php

namespace App\Services;

use App\Enums\CondicaoEntradaLote;
use App\Models\ItemEstoque;
use App\Models\Marca;
use App\Models\Material;
use App\Models\Movimentacao;
use App\Models\MovimentacaoItem;
use App\Models\NotaFiscal;
use App\Models\TipoMaterial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EntradaLoteService
{
    public function criarEntradaLote(Request $request, CondicaoEntradaLote $condicao): Movimentacao
    {
        return DB::transaction(function () use ($request, $condicao) {
            $notaFiscalId = null;

            if ($condicao->exigeNotaFiscal()) {
                $nfPath = null;
                if ($request->hasFile('nota_arquivo')) {
                    $nfPath = $request->file('nota_arquivo')->store('notas-fiscais', 'public');
                }

                $nota = NotaFiscal::create([
                    'numero' => $request->string('nota_numero')->toString(),
                    'data_emissao' => $request->input('nota_data_emissao') ?: null,
                    'fornecedor_id' => $request->filled('nota_fornecedor_id')
                        ? (int) $request->input('nota_fornecedor_id')
                        : null,
                    'arquivo_path' => $nfPath,
                ]);
                $notaFiscalId = $nota->id;
            }

            $itens = $request->input('itens', []);
            $totalQtd = 0;
            $totalValor = 0;

            foreach ($itens as $row) {
                $q = (float) ($row['quantidade'] ?? 0);
                $vu = (float) ($row['valor_unitario'] ?? 0);
                $totalQtd += $q;
                $totalValor += $q * $vu;
            }

            $movimentacao = Movimentacao::create([
                'tipo' => 'entrada_lote',
                'condicao_entrada' => $condicao->value,
                'estoque_id' => (int) $request->input('estoque_id'),
                'nota_fiscal_id' => $notaFiscalId,
                'user_id' => (int) $request->user()->id,
                'observacao' => $request->input('observacao') ?: null,
                'total_quantidade' => $totalQtd,
                'total_valor' => $totalValor,
            ]);

            foreach ($itens as $index => $row) {
                $tipoMaterialId = (int) $row['tipo_material_id'];
                $marcaId = (int) $row['marca_id'];
                $material = $this->resolverOuCriarMaterial($tipoMaterialId, $marcaId);
                $tipoMaterial = TipoMaterial::query()
                    ->select(['id', 'rastreavel'])
                    ->findOrFail($tipoMaterialId);

                $quantidade = $tipoMaterial->rastreavel ? 1.0 : (float) $row['quantidade'];
                $valorUnitario = (float) $row['valor_unitario'];

                $item = MovimentacaoItem::create([
                    'movimentacao_id' => $movimentacao->id,
                    'material_id' => $material->id,
                    'empresa_id' => isset($row['empresa_id']) && $row['empresa_id'] !== '' && $row['empresa_id'] !== null
                        ? (int) $row['empresa_id']
                        : null,
                    'local_id' => isset($row['local_id']) && $row['local_id'] !== '' && $row['local_id'] !== null
                        ? (int) $row['local_id']
                        : null,
                    'numero_serie' => ! empty($row['numero_serie']) ? trim((string) $row['numero_serie']) : null,
                    'quantidade' => $quantidade,
                    'valor_unitario' => $valorUnitario,
                    'observacao' => $row['observacao'] ?? null,
                    'anexos' => null,
                ]);

                $material->increment('quantidade_estoque', $quantidade);

                $itemEstoque = ItemEstoque::query()->firstOrCreate(
                    [
                        'estoque_id' => $movimentacao->estoque_id,
                        'material_id' => $material->id,
                    ],
                    ['quantidade' => 0],
                );
                $itemEstoque->increment('quantidade', $quantidade);

                $anexos = $this->armazenarAnexosItem($request, (int) $index, $item->id);
                if ($anexos !== []) {
                    $item->update(['anexos' => $anexos]);
                }
            }

            return $movimentacao->fresh(['estoque', 'user', 'itens.material']);
        });
    }

    private function resolverOuCriarMaterial(int $tipoMaterialId, int $marcaId): Material
    {
        $tipo = TipoMaterial::query()->findOrFail($tipoMaterialId);
        $marca = Marca::query()->findOrFail($marcaId);

        return Material::query()->firstOrCreate(
            [
                'tipo_material_id' => $tipoMaterialId,
                'marca_id' => $marcaId,
            ],
            [
                'nome' => $tipo->nome.' / '.$marca->nome,
                'quantidade_estoque' => 0,
            ],
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function armazenarAnexosItem(Request $request, int $index, int $itemId): array
    {
        $base = "entradas-lote/itens/{$itemId}";
        $out = [];

        $termo = $request->file("itens.{$index}.termo_recebimento");
        if ($termo && $termo->isValid()) {
            $out['termo_recebimento'] = $termo->store("{$base}/termo", 'public');
        }

        $fotos = $request->file("itens.{$index}.fotos", []);
        $paths = [];
        foreach ($fotos as $i => $foto) {
            if ($foto && $foto->isValid()) {
                $paths[] = $foto->store("{$base}/fotos", 'public');
            }
        }
        if ($paths !== []) {
            $out['fotos'] = $paths;
        }

        return $out;
    }
}
