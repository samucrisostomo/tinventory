<?php

namespace App\Http\Controllers;

use App\Models\Fornecedor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FornecedorController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('cadastros/fornecedores/index', [
            'fornecedores' => Fornecedor::query()
                ->select([
                    'id',
                    'nome',
                    'nome_fantasia',
                    'cnpj',
                    'inscricao_estadual',
                    'inscricao_municipal',
                    'email',
                    'telefone',
                    'celular',
                    'site',
                    'endereco',
                    'numero',
                    'complemento',
                    'bairro',
                    'cidade',
                    'estado',
                    'cep',
                    'observacoes',
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

        Fornecedor::create($data);

        return back()->with('success', 'Fornecedor criado com sucesso.');
    }

    public function update(Request $request, Fornecedor $fornecedor): RedirectResponse
    {
        $data = $request->validate(
            $this->rules($fornecedor),
            $this->messages(),
            $this->attributes(),
        );

        $fornecedor->update($data);

        return back()->with('success', 'Fornecedor atualizado com sucesso.');
    }

    public function toggleStatus(Fornecedor $fornecedor): RedirectResponse
    {
        $fornecedor->update([
            'ativo' => ! $fornecedor->ativo,
        ]);

        $message = $fornecedor->ativo
            ? 'Fornecedor ativado com sucesso.'
            : 'Fornecedor inativado com sucesso.';

        return back()->with('success', $message);
    }

    public function destroy(Fornecedor $fornecedor): RedirectResponse
    {
        $fornecedor->delete();

        return back()->with('success', 'Fornecedor excluído com sucesso.');
    }

    private function rules(?Fornecedor $fornecedor = null): array
    {
        $fornecedorId = $fornecedor?->id;

        return [
            'nome' => ['required', 'string', 'max:255'],
            'nome_fantasia' => ['nullable', 'string', 'max:255'],
            'cnpj' => [
                'required',
                'string',
                'max:20',
                Rule::unique('fornecedores', 'cnpj')->ignore($fornecedorId),
            ],
            'inscricao_estadual' => ['nullable', 'string', 'max:255'],
            'inscricao_municipal' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'telefone' => ['nullable', 'string', 'max:30'],
            'celular' => ['nullable', 'string', 'max:30'],
            'site' => ['nullable', 'string', 'max:255'],
            'endereco' => ['nullable', 'string', 'max:255'],
            'numero' => ['nullable', 'string', 'max:20'],
            'complemento' => ['nullable', 'string', 'max:255'],
            'bairro' => ['nullable', 'string', 'max:255'],
            'cidade' => ['nullable', 'string', 'max:255'],
            'estado' => ['nullable', 'string', 'size:2'],
            'cep' => ['nullable', 'string', 'max:20'],
            'observacoes' => ['nullable', 'string'],
        ];
    }

    private function messages(): array
    {
        return [
            'nome.required' => 'Informe o nome do fornecedor.',
            'nome.max' => 'O nome deve ter no máximo :max caracteres.',
            'nome_fantasia.max' => 'O nome fantasia deve ter no máximo :max caracteres.',
            'cnpj.required' => 'Informe o CNPJ do fornecedor.',
            'cnpj.unique' => 'Este CNPJ já está cadastrado para outro fornecedor.',
            'cnpj.max' => 'O CNPJ deve ter no máximo :max caracteres.',
            'inscricao_estadual.max' => 'A inscrição estadual deve ter no máximo :max caracteres.',
            'inscricao_municipal.max' => 'A inscrição municipal deve ter no máximo :max caracteres.',
            'email.email' => 'Informe um e-mail válido.',
            'email.max' => 'O e-mail deve ter no máximo :max caracteres.',
            'telefone.max' => 'O telefone deve ter no máximo :max caracteres.',
            'celular.max' => 'O celular deve ter no máximo :max caracteres.',
            'site.max' => 'O site deve ter no máximo :max caracteres.',
            'endereco.max' => 'O endereço deve ter no máximo :max caracteres.',
            'numero.max' => 'O número deve ter no máximo :max caracteres.',
            'complemento.max' => 'O complemento deve ter no máximo :max caracteres.',
            'bairro.max' => 'O bairro deve ter no máximo :max caracteres.',
            'cidade.max' => 'A cidade deve ter no máximo :max caracteres.',
            'estado.size' => 'O estado deve conter exatamente :size caracteres (UF).',
            'cep.max' => 'O CEP deve ter no máximo :max caracteres.',
        ];
    }

    private function attributes(): array
    {
        return [
            'nome' => 'nome',
            'nome_fantasia' => 'nome fantasia',
            'cnpj' => 'CNPJ',
            'inscricao_estadual' => 'inscrição estadual',
            'inscricao_municipal' => 'inscrição municipal',
            'email' => 'e-mail',
            'telefone' => 'telefone',
            'celular' => 'celular',
            'site' => 'site',
            'endereco' => 'endereço',
            'numero' => 'número',
            'complemento' => 'complemento',
            'bairro' => 'bairro',
            'cidade' => 'cidade',
            'estado' => 'estado',
            'cep' => 'CEP',
            'observacoes' => 'observações',
        ];
    }
}
