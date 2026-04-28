<?php

namespace App\Http\Controllers;

use App\Enums\CondicaoEntradaLote;
use App\Models\Empresa;
use App\Models\Estoque;
use App\Models\Fornecedor;
use App\Models\Local;
use App\Models\Marca;
use App\Models\Movimentacao;
use App\Models\TipoMaterial;
use App\Services\EntradaLoteService;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EntradaLoteController extends Controller
{
    public function __construct(
        private readonly EntradaLoteService $entradaLoteService,
    ) {}

    public function index(): Response
    {
        $inicioMes = now()->startOfMonth();

        $estatisticas = [
            'entradas_no_mes' => Movimentacao::query()
                ->where('tipo', 'entrada_lote')
                ->where('created_at', '>=', $inicioMes)
                ->count(),
            'quantidade_total_mes' => (float) (Movimentacao::query()
                ->where('tipo', 'entrada_lote')
                ->where('created_at', '>=', $inicioMes)
                ->sum('total_quantidade') ?? 0),
            'valor_total_mes' => (float) (Movimentacao::query()
                ->where('tipo', 'entrada_lote')
                ->where('created_at', '>=', $inicioMes)
                ->sum('total_valor') ?? 0),
        ];

        $entradasRecentes = Movimentacao::query()
            ->where('tipo', 'entrada_lote')
            ->select([
                'id',
                'condicao_entrada',
                'estoque_id',
                'user_id',
                'total_quantidade',
                'total_valor',
                'created_at',
            ])
            ->with([
                'estoque:id,nome',
                'user:id,name',
            ])
            ->latest()
            ->limit(20)
            ->get();

        return Inertia::render('operacoes-estoque/entradas-lote/index', array_merge([
            'estatisticas' => $estatisticas,
            'entradasRecentes' => $entradasRecentes,
            'condicoesEntrada' => CondicaoEntradaLote::options(),
        ], $this->catalogoProps()));
    }

    public function create(): Response
    {
        return Inertia::render('operacoes-estoque/entradas-lote/nova', $this->catalogoProps());
    }

    public function store(Request $request): RedirectResponse
    {
        $condicao = CondicaoEntradaLote::tryFrom((string) $request->input('condicao_entrada'));

        if (! $condicao) {
            return back()->withErrors([
                'condicao_entrada' => 'Condição da entrada inválida.',
            ])->withInput();
        }

        $validator = Validator::make(
            $request->all(),
            $this->baseRules($condicao),
            $this->messages(),
            $this->attributes(),
        );

        $validator->after(function (ValidatorContract $v) use ($request) {
            $itens = $request->input('itens', []);
            if (! is_array($itens)) {
                return;
            }

            foreach ($itens as $i => $item) {
                if (! is_array($item)) {
                    continue;
                }
                $tipoId = isset($item['tipo_material_id']) ? (int) $item['tipo_material_id'] : null;
                $marcaId = isset($item['marca_id']) ? (int) $item['marca_id'] : null;
                if (! $tipoId || ! $marcaId) {
                    continue;
                }
                $tipoMaterial = TipoMaterial::query()
                    ->select(['id', 'rastreavel'])
                    ->find($tipoId);

                if ($tipoMaterial?->rastreavel) {
                    $quantidade = isset($item['quantidade']) ? (float) $item['quantidade'] : 0;
                    if (abs($quantidade - 1.0) > 0.0001) {
                        $v->errors()->add(
                            "itens.{$i}.quantidade",
                            'Para materiais rastreáveis a quantidade deve ser igual a 1.',
                        );
                    }

                    $numeroSerie = trim((string) ($item['numero_serie'] ?? ''));
                    if ($numeroSerie === '') {
                        $v->errors()->add(
                            "itens.{$i}.numero_serie",
                            'Informe o número de série para itens rastreáveis.',
                        );
                    }
                }

                $ok = Marca::query()
                    ->where('id', $marcaId)
                    ->where('tipo_material_id', $tipoId)
                    ->where('ativo', true)
                    ->exists();
                if (! $ok) {
                    $v->errors()->add(
                        "itens.{$i}.marca_id",
                        'A marca selecionada não pertence ao tipo de material ou está inativa.',
                    );
                }

                $empresaId = $item['empresa_id'] ?? null;
                $localId = $item['local_id'] ?? null;
                if ($empresaId && $localId) {
                    $localOk = Local::query()
                        ->where('id', (int) $localId)
                        ->where('empresa_id', (int) $empresaId)
                        ->where('ativo', true)
                        ->exists();
                    if (! $localOk) {
                        $v->errors()->add(
                            "itens.{$i}.local_id",
                            'Selecione um local ativo vinculado à empresa do item.',
                        );
                    }
                }
            }
        });

        $validator->validate();

        $this->entradaLoteService->criarEntradaLote($request, $condicao);

        return redirect()
            ->route('entradas-lote.index')
            ->with('success', 'Entrada em lote registrada com sucesso.');
    }

    /**
     * @return array<string, mixed>
     */
    private function catalogoProps(): array
    {
        return [
            'tiposMateriais' => TipoMaterial::query()
                ->select(['id', 'nome', 'rastreavel'])
                ->where('ativo', true)
                ->orderBy('nome')
                ->get(),
            'marcas' => Marca::query()
                ->select(['id', 'nome', 'tipo_material_id'])
                ->where('ativo', true)
                ->orderBy('nome')
                ->get(),
            'estoques' => Estoque::query()
                ->select(['id', 'nome', 'empresa_id', 'local_id'])
                ->with([
                    'empresa:id,nome',
                    'local:id,nome,codigo',
                ])
                ->orderBy('nome')
                ->get(),
            'fornecedores' => Fornecedor::query()
                ->select(['id', 'nome', 'nome_fantasia'])
                ->where('ativo', true)
                ->orderBy('nome')
                ->get(),
            'empresas' => Empresa::query()
                ->select(['id', 'nome'])
                ->where('ativa', true)
                ->orderBy('nome')
                ->get(),
            'locais' => Local::query()
                ->select(['id', 'nome', 'codigo', 'empresa_id'])
                ->where('ativo', true)
                ->orderBy('nome')
                ->get(),
            'condicoesEntrada' => CondicaoEntradaLote::options(),
        ];
    }

    private function baseRules(CondicaoEntradaLote $condicao): array
    {
        $rules = [
            'condicao_entrada' => ['required', Rule::enum(CondicaoEntradaLote::class)],
            'estoque_id' => ['required', 'integer', 'exists:estoques,id'],
            'observacao' => ['nullable', 'string', 'max:5000'],
            'itens' => ['required', 'array', 'min:1'],
            'itens.*.tipo_material_id' => ['required', 'integer', 'exists:tipos_materiais,id'],
            'itens.*.marca_id' => ['required', 'integer', 'exists:marcas,id'],
            'itens.*.empresa_id' => ['nullable', 'integer', 'exists:empresas,id'],
            'itens.*.local_id' => ['nullable', 'integer', 'exists:locais,id'],
            'itens.*.quantidade' => ['required', 'numeric', 'min:0.0001'],
            'itens.*.valor_unitario' => ['required', 'numeric', 'min:0'],
            'itens.*.numero_serie' => ['nullable', 'string', 'max:255'],
            'itens.*.observacao' => ['nullable', 'string', 'max:2000'],
            'itens.*.termo_recebimento' => ['nullable', 'file', 'max:15360'],
            'itens.*.fotos' => ['nullable', 'array'],
            'itens.*.fotos.*' => ['file', 'max:8192'],
        ];

        if ($condicao->exigeNotaFiscal()) {
            $rules['nota_numero'] = ['required', 'string', 'max:100'];
            $rules['nota_data_emissao'] = ['nullable', 'date'];
            $rules['nota_fornecedor_id'] = ['nullable', 'integer', 'exists:fornecedores,id'];
            $rules['nota_arquivo'] = ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:20480'];
        }

        return $rules;
    }

    private function messages(): array
    {
        return [
            'condicao_entrada.required' => 'Selecione a condição da entrada.',
            'estoque_id.required' => 'Selecione o estoque de destino.',
            'itens.required' => 'Inclua ao menos um item na entrada.',
            'itens.min' => 'Inclua ao menos um item na entrada.',
            'nota_numero.required' => 'Informe o número da nota fiscal.',
        ];
    }

    private function attributes(): array
    {
        return [
            'condicao_entrada' => 'condição da entrada',
            'estoque_id' => 'estoque de destino',
            'nota_numero' => 'número da nota fiscal',
            'nota_data_emissao' => 'data de emissão da NF',
            'nota_fornecedor_id' => 'fornecedor da NF',
            'nota_arquivo' => 'arquivo da nota fiscal',
        ];
    }
}
