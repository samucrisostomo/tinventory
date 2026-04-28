<?php

namespace App\Http\Controllers;

use App\Models\Marca;
use App\Models\ModeloMarca;
use App\Services\ModeloMarcaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ModeloMarcaController extends Controller
{
    public function __construct(
        private readonly ModeloMarcaService $modeloMarcaService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('config-estoque/modelos-marcas/index', [
            'modelosMarcas' => $this->modeloMarcaService->list(),
            'marcas' => Marca::query()
                ->select(['id', 'nome'])
                ->orderBy('nome')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate(
            $this->rules(),
            $this->messages(),
            $this->attributes(),
        );

        $this->modeloMarcaService->create($data);

        return back()->with('success', 'Modelo de marca criado com sucesso.');
    }

    public function update(Request $request, ModeloMarca $modeloMarca): RedirectResponse
    {
        $data = $request->validate(
            $this->rules(),
            $this->messages(),
            $this->attributes(),
        );

        $this->modeloMarcaService->update($modeloMarca, $data);

        return back()->with('success', 'Modelo de marca atualizado com sucesso.');
    }

    public function toggleStatus(ModeloMarca $modeloMarca): RedirectResponse
    {
        $this->modeloMarcaService->toggleStatus($modeloMarca);

        $message = $modeloMarca->ativo
            ? 'Modelo de marca ativado com sucesso.'
            : 'Modelo de marca inativado com sucesso.';

        return back()->with('success', $message);
    }

    public function destroy(ModeloMarca $modeloMarca): RedirectResponse
    {
        $this->modeloMarcaService->delete($modeloMarca);

        return back()->with('success', 'Modelo de marca excluído com sucesso.');
    }

    private function rules(): array
    {
        return [
            'marcas_id' => ['required', 'integer', 'exists:marcas,id'],
            'nome' => ['required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string', 'max:255'],
        ];
    }

    private function messages(): array
    {
        return [
            'marcas_id.required' => 'Selecione a marca.',
            'marcas_id.exists' => 'A marca selecionada é inválida.',
            'nome.required' => 'Informe o nome do modelo.',
            'nome.max' => 'O nome deve ter no máximo :max caracteres.',
            'descricao.max' => 'A descrição deve ter no máximo :max caracteres.',
        ];
    }

    private function attributes(): array
    {
        return [
            'marcas_id' => 'marca',
            'nome' => 'nome',
            'descricao' => 'descrição',
        ];
    }
}
