<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NotaFiscal extends Model
{
    protected $table = 'notas_fiscais';

    protected $fillable = [
        'numero',
        'data_emissao',
        'fornecedor_id',
        'arquivo_path',
    ];

    protected function casts(): array
    {
        return [
            'data_emissao' => 'date',
        ];
    }

    public function fornecedor()
    {
        return $this->belongsTo(Fornecedor::class);
    }

    public function movimentacoes(): HasMany
    {
        return $this->hasMany(Movimentacao::class);
    }
}
