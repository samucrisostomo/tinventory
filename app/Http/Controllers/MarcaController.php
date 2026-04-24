<?php

namespace App\Http\Controllers;

use App\Models\Marca;
use App\Models\TipoMaterial;
use App\Services\MarcaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MarcaController extends Controller
{
    public function __construct(
        private readonly MarcaService $marcaService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('config-estoque/marcas/index', [
            'marcas' => $this->marcaService->list(),
            'tiposMateriais' => TipoMaterial::query()
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

        $this->marcaService->create($data);

        return back()->with('success', 'Marca criada com sucesso.');
    }

    public function update(Request $request, Marca $marca): RedirectResponse
    {
        $data = $request->validate(
            $this->rules(),
            $this->messages(),
            $this->attributes(),
        );

        $this->marcaService->update($marca, $data);

        return back()->with('success', 'Marca atualizada com sucesso.');
    }

    public function toggleStatus(Marca $marca): RedirectResponse
    {
        $this->marcaService->toggleStatus($marca);

        $message = $marca->ativo
            ? 'Marca ativada com sucesso.'
            : 'Marca inativada com sucesso.';

        return back()->with('success', $message);
    }

    public function destroy(Marca $marca): RedirectResponse
    {
        $this->marcaService->delete($marca);

        return back()->with('success', 'Marca excluída com sucesso.');
    }

    private function rules(): array
    {
        return [
            'nome' => ['required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string'],
            'tipo_material_id' => ['required', 'integer', 'exists:tipos_materiais,id'],
        ];
    }

    private function messages(): array
    {
        return [
            'nome.required' => 'Informe o nome da marca.',
            'nome.max' => 'O nome deve ter no máximo :max caracteres.',
            'tipo_material_id.required' => 'Selecione o tipo de material.',
            'tipo_material_id.exists' => 'O tipo de material selecionado é inválido.',
        ];
    }

    private function attributes(): array
    {
        return [
            'nome' => 'nome',
            'descricao' => 'descrição',
            'tipo_material_id' => 'tipo de material',
        ];
    }
}
