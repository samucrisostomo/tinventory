<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemEstoque extends Model
{
    protected $table = 'item_estoque';

    protected $fillable = [
        'estoque_id',
        'material_id',
        'quantidade',
    ];

    protected function casts(): array
    {
        return [
            'quantidade' => 'decimal:4',
        ];
    }

    public function estoque()
    {
        return $this->belongsTo(Estoque::class);
    }

    public function material()
    {
        return $this->belongsTo(Material::class);
    }
}
