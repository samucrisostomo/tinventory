<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransferenciaItem extends Model
{
    protected $table = 'transferencia_itens';

    protected $fillable = [
        'transferencia_id',
        'material_id',
        'movimentacao_item_origem_id',
        'empresa_id',
        'local_id',
        'numero_serie',
        'condicao',
        'quantidade',
    ];

    protected function casts(): array
    {
        return [
            'quantidade' => 'decimal:4',
        ];
    }

    public function transferencia(): BelongsTo
    {
        return $this->belongsTo(Transferencia::class);
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }

    public function movimentacaoItemOrigem(): BelongsTo
    {
        return $this->belongsTo(MovimentacaoItem::class, 'movimentacao_item_origem_id');
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

