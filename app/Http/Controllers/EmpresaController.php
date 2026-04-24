<?php

namespace App\Http\Controllers;

use App\Models\Empresa;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EmpresaController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('cadastros/empresas/index', [
            'empresas' => Empresa::query()
                ->select([
                    'id',
                    'codigo',
                    'nome',
                    'cnpj',
                    'endereco',
                    'cidade',
                    'estado',
                    'cep',
                    'telefone',
                    'email',
                    'observacoes',
                    'ativa',
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

        Empresa::create($data);

        return back()->with('success', 'Empresa criada com sucesso.');
    }

    public function update(Request $request, Empresa $empresa): RedirectResponse
    {
        $data = $request->validate(
            $this->rules($empresa),
            $this->messages(),
            $this->attributes(),
        );

        $empresa->update($data);

        return back()->with('success', 'Empresa atualizada com sucesso.');
    }

    public function toggleStatus(Empresa $empresa): RedirectResponse
    {
        $empresa->update([
            'ativa' => ! $empresa->ativa,
        ]);

        $message = $empresa->ativa
            ? 'Empresa ativada com sucesso.'
            : 'Empresa inativada com sucesso.';

        return back()->with('success', $message);
    }

    private function rules(?Empresa $empresa = null): array
    {
        $empresaId = $empresa?->id;

        return [
            'codigo' => [
                'required',
                'string',
                'max:255',
                Rule::unique('empresas', 'codigo')->ignore($empresaId),
            ],
            'nome' => ['required', 'string', 'max:255'],
            'cnpj' => [
                'required',
                'string',
                'max:20',
                Rule::unique('empresas', 'cnpj')->ignore($empresaId),
            ],
            'endereco' => ['nullable', 'string', 'max:255'],
            'cidade' => ['nullable', 'string', 'max:255'],
            'estado' => ['nullable', 'string', 'size:2'],
            'cep' => ['nullable', 'string', 'max:20'],
            'telefone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'observacoes' => ['nullable', 'string'],
        ];
    }

    private function messages(): array
    {
        return [
            'codigo.required' => 'Informe o código da empresa.',
            'codigo.unique' => 'Este código já está em uso por outra empresa.',
            'codigo.max' => 'O código deve ter no máximo :max caracteres.',
            'nome.required' => 'Informe o nome da empresa.',
            'nome.max' => 'O nome deve ter no máximo :max caracteres.',
            'cnpj.required' => 'Informe o CNPJ da empresa.',
            'cnpj.unique' => 'Este CNPJ já está cadastrado para outra empresa.',
            'cnpj.max' => 'O CNPJ deve ter no máximo :max caracteres.',
            'endereco.max' => 'O endereço deve ter no máximo :max caracteres.',
            'cidade.max' => 'A cidade deve ter no máximo :max caracteres.',
            'estado.size' => 'O estado deve conter exatamente :size caracteres (UF).',
            'cep.max' => 'O CEP deve ter no máximo :max caracteres.',
            'telefone.max' => 'O telefone deve ter no máximo :max caracteres.',
            'email.email' => 'Informe um e-mail válido.',
            'email.max' => 'O e-mail deve ter no máximo :max caracteres.',
        ];
    }

    private function attributes(): array
    {
        return [
            'codigo' => 'código',
            'nome' => 'nome',
            'cnpj' => 'CNPJ',
            'endereco' => 'endereço',
            'cidade' => 'cidade',
            'estado' => 'estado',
            'cep' => 'CEP',
            'telefone' => 'telefone',
            'email' => 'e-mail',
            'observacoes' => 'observações',
        ];
    }
}
