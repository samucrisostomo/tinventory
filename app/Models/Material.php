<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Material extends Model
{
    use HasFactory, SoftDeletes;

    /** @var string Tabela explícita: o inflector usa "materials" em inglês. */
    protected $table = 'materiais';

    protected $fillable = [
        'tipo_material_id',
        'marca_id',
        'modelo_marca_id',
        'nome',
        'quantidade_estoque',
    ];

    protected function casts(): array
    {
        return [
            'quantidade_estoque' => 'decimal:4',
        ];
    }

    public function tipoMaterial()
    {
        return $this->belongsTo(TipoMaterial::class);
    }

    public function marca()
    {
        return $this->belongsTo(Marca::class);
    }

    public function itensEstoque()
    {
        return $this->hasMany(ItemEstoque::class);
    }

    public function movimentacaoItens()
    {
        return $this->hasMany(MovimentacaoItem::class);
    }
}
