<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Empresa extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
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
    ];

    protected function casts(): array
    {
        return [
            'ativa' => 'boolean',
        ];
    }

    public function locais()
    {
        return $this->hasMany(Local::class);
    }

    public function colaboradores()
    {
        return $this->hasMany(Colaborador::class);
    }

    public function estoques()
    {
        return $this->hasMany(Estoque::class);
    }
}
