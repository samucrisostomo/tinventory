<?php

namespace App\Http\Controllers;

use App\Models\ItemEstoque;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use App\Services\TransferenciaEstoqueService;
use Inertia\Inertia;
use Inertia\Response;

class TransferenciaEstoqueController extends Controller
{
    public function __construct(
        private readonly TransferenciaEstoqueService $transferenciaEstoqueService,
    ) {}

    public function index(): Response
    {
        return Inertia::render(
            'operacoes-estoque/transferencias/index',
            $this->transferenciaEstoqueService->montarPagina(),
        );
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'estoque_origem_id' => ['required', 'integer', 'exists:estoques,id'],
            'estoque_destino_id' => [
                'required',
                'integer',
                'exists:estoques,id',
                'different:estoque_origem_id',
            ],
            'observacao' => ['nullable', 'string', 'max:5000'],
            'termo_recebimento' => ['nullable', 'file', 'max:15360'],
            'itens' => ['required', 'array', 'min:1'],
            'itens.*.material_id' => ['required', 'integer', 'exists:materiais,id'],
            'itens.*.movimentacao_item_origem_id' => ['nullable', 'integer', 'exists:movimentacao_itens,id'],
            'itens.*.empresa_id' => ['nullable', 'integer', 'exists:empresas,id'],
            'itens.*.local_id' => ['nullable', 'integer', 'exists:locais,id'],
            'itens.*.numero_serie' => ['nullable', 'string', 'max:255'],
            'itens.*.condicao' => ['nullable', 'string', 'max:64'],
            'itens.*.quantidade' => ['required', 'numeric', 'min:0.0001'],
        ], [
            'estoque_destino_id.different' => 'Origem e destino devem ser diferentes.',
            'itens.required' => 'Adicione ao menos um item para transferir.',
            'itens.min' => 'Adicione ao menos um item para transferir.',
        ]);

        foreach ($data['itens'] as $index => $item) {
            $saldoOrigem = (float) (ItemEstoque::query()
                ->where('estoque_id', (int) $data['estoque_origem_id'])
                ->where('material_id', (int) $item['material_id'])
                ->value('quantidade') ?? 0);

            if ((float) $item['quantidade'] > $saldoOrigem) {
                return back()->withErrors([
                    "itens.{$index}.quantidade" => 'Quantidade maior que o saldo disponível no estoque de origem.',
                ])->withInput();
            }
        }

        $this->transferenciaEstoqueService->criarTransferencia($request);

        return redirect()
            ->route('transferencias.index')
            ->with('success', 'Transferência registrada com sucesso.');
    }
}

