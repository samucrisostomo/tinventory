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
    ];

    protected function casts(): array
    {
        return [
            'ativo' => 'boolean',
        ];
    }

    public function colaboradores()
    {
        return $this->hasMany(Colaborador::class, 'tipo_colaborador_id');
    }
}
