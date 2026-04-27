<?php

namespace App\Enums;

enum CondicaoEntradaLote: string
{
    case NovoComNotaFiscal = 'novo_com_nota_fiscal';
    case NovoSemNotaFiscal = 'novo_sem_nota_fiscal';
    case UsadoComNotaFiscal = 'usado_com_nota_fiscal';
    case UsadoSemNotaFiscal = 'usado_sem_nota_fiscal';

    public function label(): string
    {
        return match ($this) {
            self::NovoComNotaFiscal => 'Novo — com nota fiscal',
            self::NovoSemNotaFiscal => 'Novo — sem nota fiscal',
            self::UsadoComNotaFiscal => 'Usado — com nota fiscal',
            self::UsadoSemNotaFiscal => 'Usado — sem nota fiscal',
        };
    }

    public function exigeNotaFiscal(): bool
    {
        return match ($this) {
            self::NovoComNotaFiscal, self::UsadoComNotaFiscal => true,
            default => false,
        };
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $c) => ['value' => $c->value, 'label' => $c->label()],
            self::cases(),
        );
    }
}
