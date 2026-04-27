<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Estoque extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'estoques';

    protected $fillable = [
        'nome',
        'tipos_estoque_id',
        'colaborador_id',
        'empresa_id',
        'local_id',
    ];

    public function tipoEstoque()
    {
        return $this->belongsTo(TipoEstoque::class, 'tipos_estoque_id');
    }

    public function colaborador()
    {
        return $this->belongsTo(Colaborador::class);
    }

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function local()
    {
        return $this->belongsTo(Local::class);
    }

    public function movimentacoes()
    {
        return $this->hasMany(Movimentacao::class);
    }

    public function itensEstoque()
    {
        return $this->hasMany(ItemEstoque::class);
    }
}
