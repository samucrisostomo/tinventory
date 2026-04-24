<?php

namespace App\Http\Controllers;

use App\Models\Perfil;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PerfilController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('cadastros/perfis/index', [
            'perfis' => Perfil::query()
                ->select([
                    'id',
                    'nome',
                    'slug',
                    'descricao',
                    'ativo',
                    'created_at',
                ])
                ->latest()
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

        $data['slug'] = $this->slugFromNome($data['nome']);

        Perfil::create($data);

        return back()->with('success', 'Perfil criado com sucesso.');
    }

    public function update(Request $request, Perfil $perfil): RedirectResponse
    {
        $data = $request->validate(
            $this->rules(),
            $this->messages(),
            $this->attributes(),
        );

        $data['slug'] = $this->slugFromNome($data['nome']);

        $perfil->update($data);

        return back()->with('success', 'Perfil atualizado com sucesso.');
    }

    public function toggleStatus(Perfil $perfil): RedirectResponse
    {
        $perfil->update([
            'ativo' => ! $perfil->ativo,
        ]);

        $message = $perfil->ativo
            ? 'Perfil ativado com sucesso.'
            : 'Perfil inativado com sucesso.';

        return back()->with('success', $message);
    }

    public function destroy(Perfil $perfil): RedirectResponse
    {
        $perfil->delete();

        return back()->with('success', 'Perfil excluído com sucesso.');
    }

    private function rules(): array
    {
        return [
            'nome' => ['required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string'],
        ];
    }

    private function messages(): array
    {
        return [
            'nome.required' => 'Informe o nome do perfil.',
            'nome.max' => 'O nome deve ter no máximo :max caracteres.',
        ];
    }

    private function attributes(): array
    {
        return [
            'nome' => 'nome',
            'descricao' => 'descrição',
        ];
    }

    private function slugFromNome(string $nome): string
    {
        return Str::slug($nome, '_');
    }
}
