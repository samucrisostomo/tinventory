<?php

namespace App\Http\Controllers;

use App\Models\TipoEstoque;
use App\Services\TipoEstoqueService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TipoEstoqueController extends Controller
{
    public function __construct(
        private readonly TipoEstoqueService $tipoEstoqueService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('config-estoque/tipos-estoque/index', [
            'tiposEstoque' => $this->tipoEstoqueService->list(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate(
            $this->rules(),
            $this->messages(),
            $this->attributes(),
        );

        $this->tipoEstoqueService->create($data);

        return back()->with('success', 'Tipo de estoque criado com sucesso.');
    }

    public function update(Request $request, TipoEstoque $tipoEstoque): RedirectResponse
    {
        $data = $request->validate(
            $this->rules($tipoEstoque),
            $this->messages(),
            $this->attributes(),
        );

        $this->tipoEstoqueService->update($tipoEstoque, $data);

        return back()->with('success', 'Tipo de estoque atualizado com sucesso.');
    }

    public function toggleStatus(TipoEstoque $tipoEstoque): RedirectResponse
    {
        $this->tipoEstoqueService->toggleStatus($tipoEstoque);

        $message = $tipoEstoque->ativo
            ? 'Tipo de estoque ativado com sucesso.'
            : 'Tipo de estoque inativado com sucesso.';

        return back()->with('success', $message);
    }

    public function destroy(TipoEstoque $tipoEstoque): RedirectResponse
    {
        $this->tipoEstoqueService->delete($tipoEstoque);

        return back()->with('success', 'Tipo de estoque excluído com sucesso.');
    }

    private function rules(?TipoEstoque $tipoEstoque = null): array
    {
        $tipoEstoqueId = $tipoEstoque?->id;

        return [
            'codigo' => [
                'required',
                'string',
                'max:255',
                Rule::unique('tipos_estoque', 'codigo')->ignore($tipoEstoqueId),
            ],
            'descricao' => ['nullable', 'string'],
        ];
    }

    private function messages(): array
    {
        return [
            'codigo.required' => 'Informe o código do tipo de estoque.',
            'codigo.unique' => 'Este código já está em uso por outro tipo de estoque.',
            'codigo.max' => 'O código deve ter no máximo :max caracteres.',
        ];
    }

    private function attributes(): array
    {
        return [
            'codigo' => 'código',
            'descricao' => 'descrição',
        ];
    }
}
