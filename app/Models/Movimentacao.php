<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Movimentacao extends Model
{
    use SoftDeletes;

    /** @var string Tabela explícita: o inflector pluraliza como "movimentacaos". */
    protected $table = 'movimentacoes';

    protected $fillable = [
        'tipo',
        'condicao_entrada',
        'estoque_id',
        'nota_fiscal_id',
        'user_id',
        'observacao',
        'total_quantidade',
        'total_valor',
    ];

    protected function casts(): array
    {
        return [
            'total_quantidade' => 'decimal:4',
            'total_valor' => 'decimal:2',
        ];
    }

    public function estoque(): BelongsTo
    {
        return $this->belongsTo(Estoque::class);
    }

    public function notaFiscal(): BelongsTo
    {
        return $this->belongsTo(NotaFiscal::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function itens(): HasMany
    {
        return $this->hasMany(MovimentacaoItem::class);
    }
}
