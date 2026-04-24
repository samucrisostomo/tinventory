<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Colaborador extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'colaboradores';

    protected $fillable = [
        'nome',
        'tipo_colaborador_id',
        'matricula',
        'cpf',
        'empresa_id',
        'local_id',
        'data_admissao',
        'data_afastamento',
        'situacao_id',
    ];

    protected function casts(): array
    {
        return [
            'data_admissao' => 'date',
            'data_afastamento' => 'date',
        ];
    }

    public function tipoColaborador()
    {
        return $this->belongsTo(TipoColaborador::class);
    }

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function local()
    {
        return $this->belongsTo(Local::class);
    }

    public function situacaoColaborador()
    {
        return $this->belongsTo(SituacaoColaborador::class, 'situacao_id');
    }
}
