<?php

namespace App\Http\Controllers;

use App\Models\Colaborador;
use App\Models\Empresa;
use App\Models\Local;
use App\Models\SituacaoColaborador;
use App\Models\TipoColaborador;
use App\Services\ColaboradorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ColaboradorController extends Controller
{
    public function __construct(
        private readonly ColaboradorService $colaboradorService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('cadastros/colaborador/index', [
            'colaboradores' => $this->colaboradorService->list(),
            'tiposColaborador' => TipoColaborador::query()
                ->select(['id', 'nome'])
                ->where('ativo', true)
                ->orderBy('nome')
                ->get(),
            'situacoesColaborador' => SituacaoColaborador::query()
                ->select(['id', 'nome'])
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
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->mergeNormalizedInput($request);

        $data = $request->validate(
            $this->rules(request: $request),
            $this->messages(),
            $this->attributes(),
        );

        $this->colaboradorService->create($data);

        return back()->with('success', 'Colaborador criado com sucesso.');
    }

    public function update(Request $request, Colaborador $colaborador): RedirectResponse
    {
        $this->mergeNormalizedInput($request);

        $data = $request->validate(
            $this->rules(colaborador: $colaborador, request: $request),
            $this->messages(),
            $this->attributes(),
        );

        $this->colaboradorService->update($colaborador, $data);

        return back()->with('success', 'Colaborador atualizado com sucesso.');
    }

    public function destroy(Colaborador $colaborador): RedirectResponse
    {
        $this->colaboradorService->delete($colaborador);

        return back()->with('success', 'Colaborador excluído com sucesso.');
    }

    private function mergeNormalizedInput(Request $request): void
    {
        $cpfDigits = preg_replace('/\D/', '', (string) $request->input('cpf', '')) ?? '';

        $dataAfastamento = $request->input('data_afastamento');
        $dataAfastamentoNormalized = ($dataAfastamento === null || $dataAfastamento === '')
            ? null
            : $dataAfastamento;

        $request->merge([
            'cpf' => $cpfDigits,
            'data_afastamento' => $dataAfastamentoNormalized,
        ]);
    }

    private function rules(?Colaborador $colaborador = null, ?Request $request = null): array
    {
        $colaboradorId = $colaborador?->id;
        $empresaId = $request?->input('empresa_id');

        return [
            'nome' => ['required', 'string', 'max:255'],
            'tipo_colaborador_id' => ['required', 'integer', 'exists:tipos_colaborador,id'],
            'matricula' => ['required', 'string', 'max:255'],
            'cpf' => [
                'required',
                'string',
                'size:11',
                'regex:/^[0-9]{11}$/',
                Rule::unique('colaboradores', 'cpf')->ignore($colaboradorId),
            ],
            'empresa_id' => ['required', 'integer', 'exists:empresas,id'],
            'local_id' => [
                'required',
                'integer',
                Rule::exists('locais', 'id')->where(function ($query) use ($empresaId) {
                    $query->where('empresa_id', $empresaId);
                }),
            ],
            'data_admissao' => ['required', 'date'],
            'data_afastamento' => ['nullable', 'date', 'after_or_equal:data_admissao'],
            'situacao_id' => ['required', 'integer', 'exists:situacoes_colaborador,id'],
        ];
    }

    private function messages(): array
    {
        return [
            'nome.required' => 'Informe o nome do colaborador.',
            'tipo_colaborador_id.required' => 'Selecione o tipo de colaborador.',
            'tipo_colaborador_id.exists' => 'O tipo de colaborador selecionado é inválido.',
            'matricula.required' => 'Informe a matrícula.',
            'cpf.required' => 'Informe o CPF.',
            'cpf.size' => 'O CPF deve conter 11 dígitos.',
            'cpf.regex' => 'O CPF deve conter apenas números (11 dígitos).',
            'cpf.unique' => 'Este CPF já está cadastrado para outro colaborador.',
            'empresa_id.required' => 'Selecione a empresa.',
            'empresa_id.exists' => 'A empresa selecionada é inválida.',
            'local_id.required' => 'Selecione o local.',
            'local_id.exists' => 'Selecione um local pertencente à empresa escolhida.',
            'data_admissao.required' => 'Informe a data de admissão.',
            'data_admissao.date' => 'Informe uma data de admissão válida.',
            'data_afastamento.date' => 'Informe uma data de afastamento válida.',
            'data_afastamento.after_or_equal' => 'A data de afastamento deve ser igual ou posterior à data de admissão.',
            'situacao_id.required' => 'Selecione a situação do colaborador.',
            'situacao_id.exists' => 'A situação selecionada é inválida.',
        ];
    }

    private function attributes(): array
    {
        return [
            'nome' => 'nome',
            'tipo_colaborador_id' => 'tipo de colaborador',
            'matricula' => 'matrícula',
            'cpf' => 'CPF',
            'empresa_id' => 'empresa',
            'local_id' => 'local',
            'data_admissao' => 'data de admissão',
            'data_afastamento' => 'data de afastamento',
            'situacao_id' => 'situação',
        ];
    }
}
