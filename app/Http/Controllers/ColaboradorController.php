<?php

namespace App\Http\Controllers;

use App\Models\Colaborador;
use App\Models\Empresa;
use App\Models\Local;
use App\Models\SituacaoColaborador;
use App\Models\TipoColaborador;
use App\Services\ColaboradorService;
use App\Support\ColaboradorRequestRules;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
                ->select(['id', 'nome', 'configuracao_formulario'])
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
        $schema = $this->resolveSchemaFromRequest($request);
        $this->stripHiddenInputs($request, $schema);
        $this->mergeNormalizedInput($request);

        $data = $request->validate(
            ColaboradorRequestRules::build(
                $schema,
                null,
                $request->input('empresa_id'),
                $request->input('matricula'),
            ),
            $this->messages(),
            $this->attributes(),
        );

        $data = $this->finalizeColaboradorDataForCreate($data, $schema);

        $this->colaboradorService->create($data);

        return back()->with('success', 'Colaborador criado com sucesso.');
    }

    public function update(Request $request, Colaborador $colaborador): RedirectResponse
    {
        $schema = $this->resolveSchemaFromRequest($request, $colaborador);
        $this->stripHiddenInputs($request, $schema);
        $this->mergeNormalizedInput($request);

        $data = $request->validate(
            ColaboradorRequestRules::build(
                $schema,
                $colaborador->id,
                $request->input('empresa_id'),
                $request->input('matricula'),
            ),
            $this->messages(),
            $this->attributes(),
        );

        $data = $this->finalizeColaboradorDataForUpdate($data, $schema);

        $this->colaboradorService->update($colaborador, $data);

        return back()->with('success', 'Colaborador atualizado com sucesso.');
    }

    public function destroy(Colaborador $colaborador): RedirectResponse
    {
        $this->colaboradorService->delete($colaborador);

        return back()->with('success', 'Colaborador excluído com sucesso.');
    }

    /**
     * @return array<string, array{visible: bool, required: bool}>
     */
    private function resolveSchemaFromRequest(Request $request, ?Colaborador $colaborador = null): array
    {
        $tipoId = (int) ($request->input('tipo_colaborador_id') ?: $colaborador?->tipo_colaborador_id);
        $tipo = TipoColaborador::query()->find($tipoId);

        return $tipo ? $tipo->resolvedFormulario() : TipoColaborador::defaultFormulario();
    }

    /**
     * @param  array<string, array{visible: bool, required: bool}>  $schema
     */
    private function stripHiddenInputs(Request $request, array $schema): void
    {
        foreach (TipoColaborador::formularioCamposChaves() as $field) {
            if (! ($schema[$field]['visible'] ?? false)) {
                $request->merge([$field => null]);
            }
        }
    }

    private function mergeNormalizedInput(Request $request): void
    {
        $cpfDigits = preg_replace('/\D/', '', (string) $request->input('cpf', '')) ?? '';
        $cpfNormalized = $cpfDigits === '' ? null : $cpfDigits;

        $dataAfastamento = $request->input('data_afastamento');
        $dataAfastamentoNormalized = ($dataAfastamento === null || $dataAfastamento === '')
            ? null
            : $dataAfastamento;

        $request->merge([
            'cpf' => $cpfNormalized,
            'data_afastamento' => $dataAfastamentoNormalized,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  array<string, array{visible: bool, required: bool}>  $schema
     * @return array<string, mixed>
     */
    private function finalizeColaboradorDataForCreate(array $data, array $schema): array
    {
        foreach (TipoColaborador::formularioCamposChaves() as $field) {
            if (! ($schema[$field]['visible'] ?? false)) {
                $data[$field] = null;

                continue;
            }

            if (array_key_exists($field, $data) && $data[$field] === '') {
                $data[$field] = null;
            }
        }

        return $data;
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  array<string, array{visible: bool, required: bool}>  $schema
     * @return array<string, mixed>
     */
    private function finalizeColaboradorDataForUpdate(array $data, array $schema): array
    {
        foreach (TipoColaborador::formularioCamposChaves() as $field) {
            if (! ($schema[$field]['visible'] ?? false)) {
                unset($data[$field]);
            }
        }

        return $data;
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
