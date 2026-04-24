<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Local extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'locais';

    protected $fillable = [
        'empresa_id',
        'codigo',
        'nome',
        'data_limite',
        'ativo',
    ];

    protected function casts(): array
    {
        return [
            'data_limite' => 'date',
            'ativo' => 'boolean',
        ];
    }

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }
}
