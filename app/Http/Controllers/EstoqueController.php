<?php

namespace App\Http\Controllers;

use App\Models\Colaborador;
use App\Models\Empresa;
use App\Models\Estoque;
use App\Models\Local;
use App\Models\TipoEstoque;
use App\Services\EstoqueService;
use App\Services\EstoqueMateriaisService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EstoqueController extends Controller
{
    public function __construct(
        private readonly EstoqueService $estoqueService,
        private readonly EstoqueMateriaisService $estoqueMateriaisService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('operacoes-estoque/estoques/index', [
            'estoques' => $this->estoqueService->list(),
            'tiposEstoque' => TipoEstoque::query()
                ->select(['id', 'codigo', 'descricao'])
                ->where('ativo', true)
                ->orderBy('codigo')
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
            'colaboradores' => Colaborador::query()
                ->select(['id', 'nome', 'empresa_id', 'local_id'])
                ->orderBy('nome')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate(
            $this->rules(request: $request),
            $this->messages(),
            $this->attributes(),
        );

        $this->estoqueService->create($data);

        return back()->with('success', 'Estoque criado com sucesso.');
    }

    public function update(Request $request, Estoque $estoque): RedirectResponse
    {
        $data = $request->validate(
            $this->rules(request: $request),
            $this->messages(),
            $this->attributes(),
        );

        $this->estoqueService->update($estoque, $data);

        return back()->with('success', 'Estoque atualizado com sucesso.');
    }

    public function destroy(Estoque $estoque): RedirectResponse
    {
        $this->estoqueService->delete($estoque);

        return back()->with('success', 'Estoque excluído com sucesso.');
    }

    public function materiais(Estoque $estoque): Response
    {
        $estoque->load([
            'tipoEstoque:id,codigo,descricao',
            'empresa:id,nome',
            'local:id,nome,codigo',
        ]);

        return Inertia::render('operacoes-estoque/estoques/materiais', array_merge([
            'estoque' => $estoque,
        ], $this->estoqueMateriaisService->montarPagina($estoque)));
    }

    private function rules(?Request $request = null): array
    {
        $empresaId = $request?->input('empresa_id');
        $localId = $request?->input('local_id');

        return [
            'nome' => ['required', 'string', 'max:255'],
            'tipos_estoque_id' => ['required', 'integer', 'exists:tipos_estoque,id'],
            'empresa_id' => ['required', 'integer', 'exists:empresas,id'],
            'local_id' => [
                'required',
                'integer',
                Rule::exists('locais', 'id')->where(function ($query) use ($empresaId) {
                    $query->where('empresa_id', $empresaId);
                }),
            ],
            'colaborador_id' => [
                'nullable',
                'integer',
                Rule::exists('colaboradores', 'id')->where(function ($query) use (
                    $empresaId,
                    $localId,
                ) {
                    $query->where('empresa_id', $empresaId)
                        ->where('local_id', $localId);
                }),
            ],
        ];
    }

    private function messages(): array
    {
        return [
            'nome.required' => 'Informe o nome do estoque.',
            'tipos_estoque_id.required' => 'Selecione o tipo de estoque.',
            'tipos_estoque_id.exists' => 'O tipo de estoque selecionado é inválido.',
            'empresa_id.required' => 'Selecione a empresa.',
            'empresa_id.exists' => 'A empresa selecionada é inválida.',
            'local_id.required' => 'Selecione o local.',
            'local_id.exists' => 'Selecione um local pertencente à empresa escolhida.',
            'colaborador_id.exists' => 'Selecione um colaborador válido para empresa/local.',
        ];
    }

    private function attributes(): array
    {
        return [
            'nome' => 'nome',
            'tipos_estoque_id' => 'tipo de estoque',
            'empresa_id' => 'empresa',
            'local_id' => 'local',
            'colaborador_id' => 'colaborador',
        ];
    }
}
