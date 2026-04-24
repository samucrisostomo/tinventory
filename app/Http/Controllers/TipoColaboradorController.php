<?php

namespace App\Http\Controllers;

use App\Models\TipoColaborador;
use App\Services\TipoColaboradorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TipoColaboradorController extends Controller
{
    public function __construct(
        private readonly TipoColaboradorService $tipoColaboradorService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('cadastros/colaborador/tipo-colaborador/index', [
            'tiposColaborador' => $this->tipoColaboradorService->list(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate(
            $this->rules(),
            $this->messages(),
            $this->attributes(),
        );

        $this->tipoColaboradorService->create($data);

        return back()->with('success', 'Tipo de colaborador criado com sucesso.');
    }

    public function update(Request $request, TipoColaborador $tipoColaborador): RedirectResponse
    {
        $data = $request->validate(
            $this->rules($tipoColaborador),
            $this->messages(),
            $this->attributes(),
        );

        $this->tipoColaboradorService->update($tipoColaborador, $data);

        return back()->with('success', 'Tipo de colaborador atualizado com sucesso.');
    }

    public function toggleStatus(TipoColaborador $tipoColaborador): RedirectResponse
    {
        $this->tipoColaboradorService->toggleStatus($tipoColaborador);

        $message = $tipoColaborador->ativo
            ? 'Tipo de colaborador ativado com sucesso.'
            : 'Tipo de colaborador inativado com sucesso.';

        return back()->with('success', $message);
    }

    public function destroy(TipoColaborador $tipoColaborador): RedirectResponse
    {
        $this->tipoColaboradorService->delete($tipoColaborador);

        return back()->with('success', 'Tipo de colaborador excluído com sucesso.');
    }

    private function rules(?TipoColaborador $tipoColaborador = null): array
    {
        $tipoColaboradorId = $tipoColaborador?->id;

        return [
            'nome' => [
                'required',
                'string',
                'max:255',
                Rule::unique('tipos_colaborador', 'nome')->ignore($tipoColaboradorId),
            ],
            'descricao' => ['nullable', 'string'],
        ];
    }

    private function messages(): array
    {
        return [
            'nome.required' => 'Informe o nome do tipo de colaborador.',
            'nome.max' => 'O nome deve ter no máximo :max caracteres.',
            'nome.unique' => 'Este nome já está em uso por outro tipo de colaborador.',
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
