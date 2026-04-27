<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TipoEstoque extends Model
{
    use HasFactory, SoftDeletes;

    /** Código do tipo usado para estoque automático ao cadastrar colaborador. */
    public const CODIGO_COLABORADOR = 'COLABORADOR';

    protected $table = 'tipos_estoque';

    protected $fillable = [
        'codigo',
        'descricao',
        'ativo',
    ];

    protected function casts(): array
    {
        return [
            'ativo' => 'boolean',
        ];
    }

    public function estoques()
    {
        return $this->hasMany(Estoque::class, 'tipos_estoque_id');
    }
}
