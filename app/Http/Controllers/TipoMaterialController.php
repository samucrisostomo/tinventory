<?php

namespace App\Http\Controllers;

use App\Models\TipoMaterial;
use App\Services\TipoMaterialService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TipoMaterialController extends Controller
{
    public function __construct(
        private readonly TipoMaterialService $tipoMaterialService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('configuracoes/estoque/tipos-materiais/index', [
            'tiposMateriais' => $this->tipoMaterialService->list(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate(
            $this->rules(),
            $this->messages(),
            $this->attributes(),
        );

        $this->tipoMaterialService->create($data);

        return back()->with('success', 'Tipo de material criado com sucesso.');
    }

    public function update(Request $request, TipoMaterial $tipoMaterial): RedirectResponse
    {
        $data = $request->validate(
            $this->rules(),
            $this->messages(),
            $this->attributes(),
        );

        $this->tipoMaterialService->update($tipoMaterial, $data);

        return back()->with('success', 'Tipo de material atualizado com sucesso.');
    }

    public function toggleStatus(TipoMaterial $tipoMaterial): RedirectResponse
    {
        $this->tipoMaterialService->toggleStatus($tipoMaterial);

        $message = $tipoMaterial->ativo
            ? 'Tipo de material ativado com sucesso.'
            : 'Tipo de material inativado com sucesso.';

        return back()->with('success', $message);
    }

    public function destroy(TipoMaterial $tipoMaterial): RedirectResponse
    {
        $this->tipoMaterialService->delete($tipoMaterial);

        return back()->with('success', 'Tipo de material excluído com sucesso.');
    }

    private function rules(): array
    {
        return [
            'nome' => ['required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string'],
            'rastreavel' => ['required', 'boolean'],
        ];
    }

    private function messages(): array
    {
        return [
            'nome.required' => 'Informe o nome do tipo de material.',
            'nome.max' => 'O nome deve ter no máximo :max caracteres.',
            'rastreavel.required' => 'Informe se o tipo de material é rastreável.',
            'rastreavel.boolean' => 'O campo rastreável deve ser verdadeiro ou falso.',
        ];
    }

    private function attributes(): array
    {
        return [
            'nome' => 'nome',
            'descricao' => 'descrição',
            'rastreavel' => 'rastreável',
        ];
    }
}
