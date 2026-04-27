<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TipoColaborador extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tipos_colaborador';

    protected $fillable = [
        'nome',
        'descricao',
        'ativo',
        'configuracao_formulario',
    ];

    protected function casts(): array
    {
        return [
            'ativo' => 'boolean',
            'configuracao_formulario' => 'array',
        ];
    }

    /**
     * Campos do formulário de colaborador configuráveis por tipo.
     *
     * @return list<string>
     */
    public static function formularioCamposChaves(): array
    {
        return [
            'nome',
            'matricula',
            'cpf',
            'empresa_id',
            'local_id',
            'data_admissao',
            'data_afastamento',
            'situacao_id',
        ];
    }

    /**
     * @return array<string, array{label: string}>
     */
    public static function formularioCamposMeta(): array
    {
        return [
            'nome' => ['label' => 'Nome'],
            'matricula' => ['label' => 'Matrícula'],
            'cpf' => ['label' => 'CPF'],
            'empresa_id' => ['label' => 'Empresa'],
            'local_id' => ['label' => 'Local'],
            'data_admissao' => ['label' => 'Data de admissão'],
            'data_afastamento' => ['label' => 'Data de afastamento'],
            'situacao_id' => ['label' => 'Situação'],
        ];
    }

    /**
     * @return array<string, array{visible: bool, required: bool}>
     */
    public static function defaultFormulario(): array
    {
        $out = [];
        foreach (self::formularioCamposChaves() as $key) {
            $out[$key] = [
                'visible' => true,
                'required' => $key !== 'data_afastamento',
            ];
        }

        return $out;
    }

    /**
     * @param  array<string, mixed>|null  $stored
     * @return array<string, array{visible: bool, required: bool}>
     */
    public static function mergeFormulario(?array $stored): array
    {
        $base = self::defaultFormulario();
        if ($stored === null || $stored === []) {
            return $base;
        }

        foreach (self::formularioCamposChaves() as $key) {
            $raw = $stored[$key] ?? null;
            if (! is_array($raw)) {
                continue;
            }
            $visible = array_key_exists('visible', $raw) ? (bool) $raw['visible'] : $base[$key]['visible'];
            $required = array_key_exists('required', $raw) ? (bool) $raw['required'] : $base[$key]['required'];
            if ($required) {
                $visible = true;
            }
            $base[$key] = ['visible' => $visible, 'required' => $required];
        }

        $base['nome']['visible'] = true;
        $base['nome']['required'] = true;

        return $base;
    }

    /**
     * @return array<string, array{visible: bool, required: bool}>
     */
    public function resolvedFormulario(): array
    {
        return self::mergeFormulario($this->configuracao_formulario);
    }

    /**
     * @param  array<string, mixed>|null  $input
     * @return array<string, array{visible: bool, required: bool}>
     */
    public static function normalizeFormularioInput(?array $input): array
    {
        if ($input === null) {
            return self::defaultFormulario();
        }

        $filtered = [];
        foreach (self::formularioCamposChaves() as $key) {
            if (! isset($input[$key]) || ! is_array($input[$key])) {
                continue;
            }
            $filtered[$key] = $input[$key];
        }

        return self::mergeFormulario($filtered);
    }

    public function colaboradores()
    {
        return $this->hasMany(Colaborador::class, 'tipo_colaborador_id');
    }
}
