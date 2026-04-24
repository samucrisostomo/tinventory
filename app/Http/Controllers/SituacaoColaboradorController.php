<?php

namespace App\Http\Controllers;

use App\Models\SituacaoColaborador;
use App\Services\SituacaoColaboradorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SituacaoColaboradorController extends Controller
{
    public function __construct(
        private readonly SituacaoColaboradorService $situacaoColaboradorService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('cadastros/colaborador/situacao-colaborador/index', [
            'situacoesColaborador' => $this->situacaoColaboradorService->list(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate(
            $this->rules(),
            $this->messages(),
            $this->attributes(),
        );

        $this->situacaoColaboradorService->create($data);

        return back()->with('success', 'Situação do colaborador criada com sucesso.');
    }

    public function update(Request $request, SituacaoColaborador $situacaoColaborador): RedirectResponse
    {
        $data = $request->validate(
            $this->rules($situacaoColaborador),
            $this->messages(),
            $this->attributes(),
        );

        $this->situacaoColaboradorService->update($situacaoColaborador, $data);

        return back()->with('success', 'Situação do colaborador atualizada com sucesso.');
    }

    public function toggleStatus(SituacaoColaborador $situacaoColaborador): RedirectResponse
    {
        $this->situacaoColaboradorService->toggleStatus($situacaoColaborador);

        $message = $situacaoColaborador->ativo
            ? 'Situação do colaborador ativada com sucesso.'
            : 'Situação do colaborador inativada com sucesso.';

        return back()->with('success', $message);
    }

    public function destroy(SituacaoColaborador $situacaoColaborador): RedirectResponse
    {
        $this->situacaoColaboradorService->delete($situacaoColaborador);

        return back()->with('success', 'Situação do colaborador excluída com sucesso.');
    }

    private function rules(?SituacaoColaborador $situacaoColaborador = null): array
    {
        $situacaoColaboradorId = $situacaoColaborador?->id;

        return [
            'nome' => [
                'required',
                'string',
                'max:255',
                Rule::unique('situacoes_colaborador', 'nome')->ignore($situacaoColaboradorId),
            ],
            'descricao' => ['nullable', 'string'],
        ];
    }

    private function messages(): array
    {
        return [
            'nome.required' => 'Informe o nome da situação do colaborador.',
            'nome.max' => 'O nome deve ter no máximo :max caracteres.',
            'nome.unique' => 'Este nome já está em uso por outra situação do colaborador.',
        ];
    }

    private function attributes(): array
    {
        return [
            'nome' => 'nome',
            'descricao' => 'descrição',
        ];
    }
}
