<?php

namespace App\Support;

use App\Models\TipoColaborador;
use Illuminate\Validation\Rule;

class ColaboradorRequestRules
{
    /**
     * @param  array<string, array{visible: bool, required: bool}>  $schema
     * @return array<string, mixed>
     */
    public static function build(array $schema, ?int $colaboradorId, mixed $empresaId): array
    {
        $rules = [
            'tipo_colaborador_id' => ['required', 'integer', 'exists:tipos_colaborador,id'],
        ];

        foreach (TipoColaborador::formularioCamposChaves() as $field) {
            if ($field === 'nome') {
                $rules['nome'] = ['required', 'string', 'max:255'];

                continue;
            }

            $visible = $schema[$field]['visible'] ?? false;
            $required = $schema[$field]['required'] ?? false;

            if (! $visible) {
                $rules[$field] = match ($field) {
                    'cpf' => ['nullable', 'string', 'max:11'],
                    'empresa_id', 'local_id', 'situacao_id' => ['nullable', 'integer'],
                    'data_admissao', 'data_afastamento' => ['nullable', 'date'],
                    default => ['nullable', 'string', 'max:255'],
                };

                continue;
            }

            if ($field === 'matricula') {
                $rules['matricula'] = $required
                    ? ['required', 'string', 'max:255']
                    : ['nullable', 'string', 'max:255'];

                continue;
            }

            if ($field === 'cpf') {
                $rules['cpf'] = $required
                    ? [
                        'required',
                        'string',
                        'size:11',
                        'regex:/^[0-9]{11}$/',
                        Rule::unique('colaboradores', 'cpf')->ignore($colaboradorId),
                    ]
                    : [
                        'nullable',
                        'string',
                        'size:11',
                        'regex:/^[0-9]{11}$/',
                        Rule::unique('colaboradores', 'cpf')->ignore($colaboradorId),
                    ];

                continue;
            }

            if ($field === 'empresa_id') {
                $rules['empresa_id'] = $required
                    ? ['required', 'integer', 'exists:empresas,id']
                    : ['nullable', 'integer', 'exists:empresas,id'];

                continue;
            }

            if ($field === 'local_id') {
                $localRules = $required ? ['required', 'integer'] : ['nullable', 'integer'];
                if ($empresaId !== null && $empresaId !== '') {
                    $localRules[] = Rule::exists('locais', 'id')->where(function ($query) use ($empresaId) {
                        $query->where('empresa_id', $empresaId);
                    });
                }
                $rules['local_id'] = $localRules;

                continue;
            }

            if ($field === 'data_admissao') {
                $rules['data_admissao'] = $required
                    ? ['required', 'date']
                    : ['nullable', 'date'];

                continue;
            }

            if ($field === 'data_afastamento') {
                $rules['data_afastamento'] = ['nullable', 'date', 'after_or_equal:data_admissao'];

                continue;
            }

            if ($field === 'situacao_id') {
                $rules['situacao_id'] = $required
                    ? ['required', 'integer', 'exists:situacoes_colaborador,id']
                    : ['nullable', 'integer', 'exists:situacoes_colaborador,id'];
            }
        }

        return $rules;
    }
}
