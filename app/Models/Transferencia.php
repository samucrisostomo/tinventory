<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transferencia extends Model
{
    use SoftDeletes;

    protected $table = 'transferencias';

    protected $fillable = [
        'estoque_origem_id',
        'estoque_destino_id',
        'user_id',
        'termo_recebimento_path',
        'observacao',
        'total_itens',
    ];

    protected function casts(): array
    {
        return [
            'total_itens' => 'decimal:4',
        ];
    }

    public function estoqueOrigem(): BelongsTo
    {
        return $this->belongsTo(Estoque::class, 'estoque_origem_id');
    }

    public function estoqueDestino(): BelongsTo
    {
        return $this->belongsTo(Estoque::class, 'estoque_destino_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function itens(): HasMany
    {
        return $this->hasMany(TransferenciaItem::class);
    }
}

