<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MovimentacaoItem extends Model
{
    protected $table = 'movimentacao_itens';

    protected $fillable = [
        'movimentacao_id',
        'material_id',
        'empresa_id',
        'local_id',
        'numero_serie',
        'quantidade',
        'valor_unitario',
        'observacao',
        'anexos',
    ];

    protected function casts(): array
    {
        return [
            'quantidade' => 'decimal:4',
            'valor_unitario' => 'decimal:2',
            'anexos' => 'array',
        ];
    }

    public function movimentacao(): BelongsTo
    {
        return $this->belongsTo(Movimentacao::class);
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function local(): BelongsTo
    {
        return $this->belongsTo(Local::class);
    }
}
