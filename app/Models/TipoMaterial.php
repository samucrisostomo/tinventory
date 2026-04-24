<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TipoMaterial extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tipos_materiais';

    protected $fillable = [
        'nome',
        'mascara',
        'descricao',
        'ativo',
        'rastreavel',
    ];

    protected function casts(): array
    {
        return [
            'ativo' => 'boolean',
            'rastreavel' => 'boolean',
        ];
    }
}
