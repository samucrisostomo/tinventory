<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ModeloMarca extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'modelos_marcas';

    protected $fillable = [
        'marcas_id',
        'nome',
        'descricao',
        'ativo',
    ];

    protected function casts(): array
    {
        return [
            'ativo' => 'boolean',
        ];
    }

    public function marca()
    {
        return $this->belongsTo(Marca::class, 'marcas_id');
    }
}
