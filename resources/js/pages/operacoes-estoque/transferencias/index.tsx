import { Head, router, usePage } from '@inertiajs/react';
import { ArrowRightLeft, ClipboardList, Clock3, EllipsisVertical, FileText, Plus, Repeat, Trash2, Warehouse } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const SELECT_VAZIO = '__none__';

type EstoqueOption = {
    id: number;
    nome: string;
    empresa: { id: number; nome: string } | null;
    local: { id: number; nome: string; codigo: string } | null;
};

type VinculoOption = {
    id: number;
    numero_serie: string | null;
    local_id: number | null;
    local_nome: string | null;
    empresa_id: number | null;
    empresa_nome: string | null;
    condicao: string | null;
};

type MaterialOption = {
    material_id: number;
    codigo: string;
    descricao: string;
    quantidade_disponivel: number;
    vinculos: VinculoOption[];
};

type ItemTransferencia = {
    material_id: string;
    movimentacao_item_origem_id: string;
    numero_serie: string;
    local_id: string;
    local: string;
    empresa_id: string;
    empresa: string;
    condicao: string;
    quantidade: string;
};

type Props = {
    estoques: EstoqueOption[];
    materiaisPorEstoque: Record<string, MaterialOption[]>;
    transferenciasRecentes: {
        id: number;
        estoque_origem: string;
        estoque_destino: string;
        usuario: string;
        total_itens: number;
        observacao: string | null;
        termo_url: string | null;
        created_at: string | null;
    }[];
};

const novoItem = (): ItemTransferencia => ({
    material_id: '',
    movimentacao_item_origem_id: '',
    numero_serie: '',
    local_id: '',
    local: '',
    empresa_id: '',
    empresa: '',
    condicao: '',
    quantidade: '',
});

const selectVal = (value: string) => (value === '' ? SELECT_VAZIO : value);

export default function TransferenciasEstoquePage({
    estoques,
    materiaisPorEstoque,
    transferenciasRecentes,
}: Props) {
    const { flash } = usePage().props as {
        flash?: { success?: string; error?: string };
    };
    const [modalAberto, setModalAberto] = useState(false);
    const [estoqueOrigemId, setEstoqueOrigemId] = useState('');
    const [estoqueDestinoId, setEstoqueDestinoId] = useState('');
    const [itens, setItens] = useState<ItemTransferencia[]>([novoItem()]);
    const [termoRecebimento, setTermoRecebimento] = useState<File | null>(null);
    const [observacoes, setObservacoes] = useState('');
    const colunaFormularioRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash?.success, flash?.error]);

    const materiaisDaOrigem = useMemo(
        () => materiaisPorEstoque[estoqueOrigemId] ?? [],
        [materiaisPorEstoque, estoqueOrigemId],
    );

    const mapaMateriais = useMemo(() => {
        const map = new Map<string, MaterialOption>();
        for (const material of materiaisDaOrigem) {
            map.set(String(material.material_id), material);
        }

        return map;
    }, [materiaisDaOrigem]);

    const estoqueOrigem = useMemo(
        () => estoques.find((estoque) => String(estoque.id) === estoqueOrigemId) ?? null,
        [estoques, estoqueOrigemId],
    );

    const estoqueDestino = useMemo(
        () => estoques.find((estoque) => String(estoque.id) === estoqueDestinoId) ?? null,
        [estoques, estoqueDestinoId],
    );

    const resumo = useMemo(() => {
        const itensPreenchidos = itens.filter((item) => item.material_id !== '');
        const totalQuantidade = itensPreenchidos.reduce((acc, item) => {
            const valor = Number(item.quantidade.replace(',', '.')) || 0;

            return acc + valor;
        }, 0);

        return {
            totalItens: itensPreenchidos.length,
            totalQuantidade,
        };
    }, [itens]);

    const indicadores = useMemo(() => {
        const totalTransferencias = transferenciasRecentes.length;
        const totalQuantidade = transferenciasRecentes.reduce(
            (acc, transferencia) => acc + transferencia.total_itens,
            0,
        );

        return {
            totalTransferencias,
            totalQuantidade,
        };
    }, [transferenciasRecentes]);

    const atualizarItem = (index: number, patch: Partial<ItemTransferencia>) => {
        setItens((current) =>
            current.map((item, itemIndex) =>
                itemIndex === index ? { ...item, ...patch } : item,
            ),
        );
    };

    const adicionarItemComScroll = () => {
        const novoIndex = itens.length;

        setItens((current) => [...current, novoItem()]);

        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                const container = colunaFormularioRef.current;
                const target = document.getElementById(
                    `item-transferencia-${novoIndex}`,
                );

                if (!target || !container) {
                    return;
                }

                const containerRect = container.getBoundingClientRect();
                const targetRect = target.getBoundingClientRect();
                const nextTop =
                    container.scrollTop + (targetRect.top - containerRect.top) - 8;

                container.scrollTo({
                    top: Math.max(0, nextTop),
                    behavior: 'smooth',
                });
            });
        });
    };

    const trocarOrigem = (value: string) => {
        const origemId = value === SELECT_VAZIO ? '' : value;

        setEstoqueOrigemId(origemId);
        setItens([novoItem()]);
        setTermoRecebimento(null);
        setObservacoes('');
    };

    const trocarDestino = (value: string) => {
        setEstoqueDestinoId(value === SELECT_VAZIO ? '' : value);
    };

    const opcoesCampo = (
        item: ItemTransferencia,
        key: keyof Pick<VinculoOption, 'numero_serie' | 'local_nome' | 'empresa_nome' | 'condicao'>,
    ) => {
        const material = mapaMateriais.get(item.material_id);

        if (!material) {
            return [];
        }

        const values = material.vinculos
            .map((vinculo) => vinculo[key])
            .filter((value): value is string => value !== null && value !== '');

        return Array.from(new Set(values));
    };

    const trocarMaterialItem = (index: number, value: string) => {
        const materialId = value === SELECT_VAZIO ? '' : value;

        if (materialId === '') {
            atualizarItem(index, {
                material_id: '',
                movimentacao_item_origem_id: '',
                numero_serie: '',
                local_id: '',
                local: '',
                empresa_id: '',
                empresa: '',
                condicao: '',
                quantidade: '',
            });

            return;
        }

        const material = mapaMateriais.get(materialId);
        const primeiroVinculo = material?.vinculos[0];

        atualizarItem(index, {
            material_id: materialId,
            movimentacao_item_origem_id: primeiroVinculo?.id ? String(primeiroVinculo.id) : '',
            numero_serie: primeiroVinculo?.numero_serie ?? '',
            local_id: primeiroVinculo?.local_id ? String(primeiroVinculo.local_id) : '',
            local: primeiroVinculo?.local_nome ?? '',
            empresa_id: primeiroVinculo?.empresa_id ? String(primeiroVinculo.empresa_id) : '',
            empresa: primeiroVinculo?.empresa_nome ?? '',
            condicao: primeiroVinculo?.condicao ?? '',
            quantidade: '1',
        });
    };

    const trocarNumeroSerieItem = (index: number, value: string) => {
        const numeroSerie = value === SELECT_VAZIO ? '' : value;
        const item = itens[index];
        const material = item ? mapaMateriais.get(item.material_id) : undefined;

        if (!item || !material) {
            atualizarItem(index, { numero_serie: numeroSerie });

            return;
        }

        if (numeroSerie === '') {
            atualizarItem(index, {
                numero_serie: '',
                movimentacao_item_origem_id: '',
                empresa_id: '',
                empresa: '',
                local_id: '',
                local: '',
            });

            return;
        }

        const vinculo = material.vinculos.find(
            (itemVinculo) => itemVinculo.numero_serie === numeroSerie,
        );

        atualizarItem(index, {
            numero_serie: numeroSerie,
            movimentacao_item_origem_id: vinculo?.id ? String(vinculo.id) : '',
            empresa_id: vinculo?.empresa_id ? String(vinculo.empresa_id) : '',
            empresa: vinculo?.empresa_nome ?? '',
            local_id: vinculo?.local_id ? String(vinculo.local_id) : '',
            local: vinculo?.local_nome ?? '',
            condicao: vinculo?.condicao ?? item.condicao,
        });
    };

    const aoMudarModal = (aberto: boolean) => {
        setModalAberto(aberto);

        if (!aberto) {
            setEstoqueOrigemId('');
            setEstoqueDestinoId('');
            setItens([novoItem()]);
            setTermoRecebimento(null);
            setObservacoes('');
        }
    };

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (estoqueOrigemId === '' || estoqueDestinoId === '') {
            toast.error('Selecione o estoque de origem e destino.');

            return;
        }

        if (estoqueOrigemId === estoqueDestinoId) {
            toast.error('Origem e destino devem ser diferentes.');

            return;
        }

        if (!itens.some((item) => item.material_id !== '')) {
            toast.error('Adicione pelo menos um item para transferir.');

            return;
        }

        const itensPayload = itens
            .filter((item) => item.material_id !== '')
            .map((item) => ({
                material_id: item.material_id,
                movimentacao_item_origem_id: item.movimentacao_item_origem_id || '',
                empresa_id: item.empresa_id || '',
                local_id: item.local_id || '',
                numero_serie: item.numero_serie || '',
                condicao: item.condicao || '',
                quantidade: item.quantidade || '0',
            }));

        router.post('/operacoes-estoque/transferencias', {
            estoque_origem_id: estoqueOrigemId,
            estoque_destino_id: estoqueDestinoId,
            observacao: observacoes,
            termo_recebimento: termoRecebimento,
            itens: itensPayload,
        }, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => aoMudarModal(false),
            onError: () => toast.error('Não foi possível salvar a transferência.'),
        });
    };

    return (
        <>
            <Head title="Transferências de estoque" />

            <div className="space-y-6 p-4">
                <div className="rounded-2xl border border-primary/20 bg-linear-to-r from-primary/15 via-background to-primary/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                            <h1 className="text-xl font-semibold">Transferências de estoque</h1>
                            <p className="text-sm text-muted-foreground">
                                Selecione origem e destino, adicione itens e confirme com resumo em tempo real.
                            </p>
                        </div>
                        <Button type="button" onClick={() => aoMudarModal(true)}>
                            <ArrowRightLeft className="mr-2 h-4 w-4" />
                            Nova transferência
                        </Button>
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    <Card className="border-primary/20">
                        <CardContent className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-xs text-muted-foreground">Transferências recentes</p>
                                <p className="text-2xl font-semibold">{indicadores.totalTransferencias}</p>
                            </div>
                            <Clock3 className="h-5 w-5 text-primary" />
                        </CardContent>
                    </Card>
                    <Card className="border-primary/20">
                        <CardContent className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-xs text-muted-foreground">Quantidade movimentada</p>
                                <p className="text-2xl font-semibold">
                                    {indicadores.totalQuantidade.toLocaleString('pt-BR', {
                                        maximumFractionDigits: 4,
                                    })}
                                </p>
                            </div>
                            <ArrowRightLeft className="h-5 w-5 text-primary" />
                        </CardContent>
                    </Card>
                    <Card className="border-primary/20">
                        <CardContent className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-xs text-muted-foreground">Estoques disponíveis</p>
                                <p className="text-2xl font-semibold">{estoques.length}</p>
                            </div>
                            <Warehouse className="h-5 w-5 text-primary" />
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-border/70">
                    <CardHeader>
                        <CardTitle>Transferências</CardTitle>
                        <CardDescription>
                            Últimas transferências registradas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {transferenciasRecentes.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">
                                Nenhuma transferência registrada.
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {transferenciasRecentes.map((transferencia) => (
                                    <Card
                                        key={transferencia.id}
                                        className="group relative overflow-hidden border-primary/45 bg-linear-to-br from-primary/30 via-card to-primary/15 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-primary/35 dark:from-primary/25 dark:to-primary/10"
                                    >
                                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.35),transparent_48%)] dark:bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.28),transparent_48%)]" />
                                        <CardHeader className="space-y-3 pb-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                                    TRF-{String(transferencia.id).padStart(5, '0')}
                                                </p>
                                                <div className="flex items-center gap-1">
                                                    <span className="rounded-full border border-primary/40 bg-primary/20 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                                        {transferencia.total_itens.toLocaleString('pt-BR', {
                                                            maximumFractionDigits: 4,
                                                        })}{' '}
                                                        itens
                                                    </span>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 rounded-full"
                                                                aria-label="Abrir ações da transferência"
                                                            >
                                                                <EllipsisVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            {transferencia.termo_url ? (
                                                                <DropdownMenuItem asChild>
                                                                    <a
                                                                        href={transferencia.termo_url}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                    >
                                                                        <FileText className="mr-2 h-4 w-4" />
                                                                        Ver termo de recebimento
                                                                    </a>
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem disabled>
                                                                    <FileText className="mr-2 h-4 w-4" />
                                                                    Termo não anexado
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                            <div className="rounded-lg border border-zinc-300/80 bg-zinc-100/85 p-3 text-zinc-900 dark:border-accent/60 dark:bg-accent/20 dark:text-foreground">
                                                <p className="text-xs text-zinc-600 dark:text-muted-foreground">Rota</p>
                                                <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-foreground">
                                                    {transferencia.estoque_origem}
                                                </p>
                                                <p className="-mb-0.5 text-[11px] leading-none text-zinc-600 dark:text-muted-foreground">
                                                    para
                                                </p>
                                                <p className="text-sm font-medium text-zinc-900 dark:text-foreground">
                                                    {transferencia.estoque_destino}
                                                </p>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3 pt-0">
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="rounded-lg border border-zinc-300/80 bg-zinc-100/80 p-2 text-zinc-900 dark:border-accent/60 dark:bg-accent/15 dark:text-foreground">
                                                    <p className="text-zinc-600 dark:text-muted-foreground">Usuário</p>
                                                    <p className="mt-0.5 text-sm font-medium text-zinc-900 dark:text-foreground">
                                                        {transferencia.usuario}
                                                    </p>
                                                </div>
                                                <div className="rounded-lg border border-zinc-300/80 bg-zinc-100/80 p-2 text-zinc-900 dark:border-accent/60 dark:bg-accent/15 dark:text-foreground">
                                                    <p className="text-zinc-600 dark:text-muted-foreground">Data</p>
                                                    <p className="mt-0.5 text-sm font-medium text-zinc-900 dark:text-foreground">
                                                        {transferencia.created_at
                                                            ? new Date(
                                                                  transferencia.created_at,
                                                              ).toLocaleString('pt-BR')
                                                            : '-'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="rounded-lg border border-zinc-300/80 bg-zinc-100/80 p-2 text-zinc-900 dark:border-accent/60 dark:bg-accent/15 dark:text-foreground">
                                                <p className="text-xs text-zinc-600 dark:text-muted-foreground">Observação</p>
                                                <p
                                                    className="line-clamp-2 text-sm text-zinc-900 wrap-break-word dark:text-foreground"
                                                    title={transferencia.observacao ?? ''}
                                                >
                                                    {transferencia.observacao ?? '-'}
                                                </p>
                                            </div>
                                            <div className="border-t border-border/60 pt-2" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={modalAberto} onOpenChange={aoMudarModal}>
                <DialogContent className="grid h-[97vh] max-h-[97vh] w-[calc(100vw-1.5rem)] max-w-none grid-rows-[auto_minmax(0,1fr)] overflow-hidden sm:w-[calc(100vw-4rem)] sm:max-w-none lg:w-[calc(100vw-8rem)]">
                    <DialogHeader>
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.22),transparent_52%)]" />
                        <DialogTitle className="relative text-primary">
                            Nova transferência
                        </DialogTitle>
                        <DialogDescription className="relative text-foreground/80">
                            Informe origem, destino e itens para montar a transferência.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={onSubmit} className="flex min-h-0 flex-col overflow-hidden">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                                1. Defina origem e destino
                            </span>
                            <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                                2. Inclua os itens
                            </span>
                            <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                                3. Revise e confirme
                            </span>
                        </div>
                        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_340px] gap-4 overflow-x-auto">
                            <div
                                ref={colunaFormularioRef}
                                className="min-h-0 space-y-4 overflow-y-auto overscroll-y-contain pr-1"
                            >
                                <Card className="border-primary/20">
                                    <CardHeader>
                                        <CardTitle className="text-base">Origem e destino</CardTitle>
                                        <CardDescription>
                                            Escolha os estoques para movimentação. Origem e destino devem ser diferentes.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid gap-3 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Estoque de origem *</Label>
                                            <Select
                                                value={selectVal(estoqueOrigemId)}
                                                onValueChange={trocarOrigem}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Selecione a origem" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={SELECT_VAZIO} disabled>
                                                        Selecione
                                                    </SelectItem>
                                                    {estoques.map((estoque) => (
                                                        <SelectItem
                                                            key={estoque.id}
                                                            value={String(estoque.id)}
                                                        >
                                                            {estoque.nome}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Estoque de destino *</Label>
                                            <Select
                                                value={selectVal(estoqueDestinoId)}
                                                onValueChange={trocarDestino}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Selecione o destino" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={SELECT_VAZIO} disabled>
                                                        Selecione
                                                    </SelectItem>
                                                    {estoques
                                                        .filter(
                                                            (estoque) =>
                                                                String(estoque.id) !==
                                                                estoqueOrigemId,
                                                        )
                                                        .map((estoque) => (
                                                            <SelectItem
                                                                key={estoque.id}
                                                                value={String(estoque.id)}
                                                            >
                                                                {estoque.nome}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                        <CardTitle className="text-base">Itens da transferência</CardTitle>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={adicionarItemComScroll}
                                        >
                                            <Plus className="mr-1 h-4 w-4" />
                                            Adicionar item
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {itens.map((item, index) => {
                                            const materialSelecionado = mapaMateriais.get(
                                                item.material_id,
                                            );
                                            const opcoesSerie = opcoesCampo(item, 'numero_serie');
                                            const opcoesLocal = opcoesCampo(item, 'local_nome');
                                            const opcoesEmpresa = opcoesCampo(item, 'empresa_nome');
                                            const opcoesCondicao = opcoesCampo(item, 'condicao');

                                            return (
                                                <div
                                                    key={`item-transferencia-${index}`}
                                                    id={`item-transferencia-${index}`}
                                                    className="space-y-3 rounded-lg border border-border/70 p-3"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-medium">
                                                            Item {index + 1}
                                                        </p>
                                                        {itens.length > 1 && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive"
                                                                onClick={() =>
                                                                    setItens((current) =>
                                                                        current.filter(
                                                                            (_, itemIndex) =>
                                                                                itemIndex !== index,
                                                                        ),
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                                        <div className="space-y-2 xl:col-span-2">
                                                            <Label>Material *</Label>
                                                            <Select
                                                                value={selectVal(item.material_id)}
                                                                onValueChange={(value) =>
                                                                    trocarMaterialItem(
                                                                        index,
                                                                        value,
                                                                    )
                                                                }
                                                                disabled={
                                                                    estoqueOrigemId === ''
                                                                }
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Selecione o material" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem
                                                                        value={SELECT_VAZIO}
                                                                        disabled
                                                                    >
                                                                        Selecione
                                                                    </SelectItem>
                                                                    {materiaisDaOrigem.map(
                                                                        (material) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    material.material_id
                                                                                }
                                                                                value={String(
                                                                                    material.material_id,
                                                                                )}
                                                                            >
                                                                                {material.codigo} -{' '}
                                                                                {material.descricao}
                                                                            </SelectItem>
                                                                        ),
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Quantidade *</Label>
                                                            <Input
                                                                value={item.quantidade}
                                                                onChange={(event) =>
                                                                    atualizarItem(index, {
                                                                        quantidade:
                                                                            event.target.value,
                                                                    })
                                                                }
                                                                placeholder="0"
                                                                inputMode="decimal"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                                        <div className="space-y-2">
                                                            <Label>Número de série</Label>
                                                            <Select
                                                                value={selectVal(item.numero_serie)}
                                                                onValueChange={(value) => trocarNumeroSerieItem(index, value)}
                                                                disabled={item.material_id === ''}
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Selecione" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value={SELECT_VAZIO}>
                                                                        Não informado
                                                                    </SelectItem>
                                                                    {opcoesSerie.map((option) => (
                                                                        <SelectItem
                                                                            key={option}
                                                                            value={option}
                                                                        >
                                                                            {option}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Empresa</Label>
                                                            <Select
                                                                value={selectVal(item.empresa)}
                                                                onValueChange={(value) =>
                                                                    {
                                                                        const nextEmpresa =
                                                                            value === SELECT_VAZIO
                                                                                ? ''
                                                                                : value;
                                                                        const material =
                                                                            mapaMateriais.get(
                                                                                item.material_id,
                                                                            );
                                                                        const vinculo =
                                                                            material?.vinculos.find(
                                                                                (v) =>
                                                                                    (v.empresa_nome ??
                                                                                        '') ===
                                                                                    nextEmpresa,
                                                                            );

                                                                        atualizarItem(index, {
                                                                            empresa: nextEmpresa,
                                                                            empresa_id: vinculo?.empresa_id
                                                                                ? String(vinculo.empresa_id)
                                                                                : '',
                                                                        });
                                                                    }
                                                                }
                                                                disabled={item.material_id === ''}
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Selecione" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value={SELECT_VAZIO}>
                                                                        Não informado
                                                                    </SelectItem>
                                                                    {opcoesEmpresa.map((option) => (
                                                                        <SelectItem
                                                                            key={option}
                                                                            value={option}
                                                                        >
                                                                            {option}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Local</Label>
                                                            <Select
                                                                value={selectVal(item.local)}
                                                                onValueChange={(value) =>
                                                                    {
                                                                        const nextLocal =
                                                                            value === SELECT_VAZIO
                                                                                ? ''
                                                                                : value;
                                                                        const material =
                                                                            mapaMateriais.get(
                                                                                item.material_id,
                                                                            );
                                                                        const vinculo =
                                                                            material?.vinculos.find(
                                                                                (v) =>
                                                                                    (v.local_nome ??
                                                                                        '') ===
                                                                                    nextLocal,
                                                                            );

                                                                        atualizarItem(index, {
                                                                            local: nextLocal,
                                                                            local_id: vinculo?.local_id
                                                                                ? String(vinculo.local_id)
                                                                                : '',
                                                                        });
                                                                    }
                                                                }
                                                                disabled={item.material_id === ''}
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Selecione" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value={SELECT_VAZIO}>
                                                                        Não informado
                                                                    </SelectItem>
                                                                    {opcoesLocal.map((option) => (
                                                                        <SelectItem
                                                                            key={option}
                                                                            value={option}
                                                                        >
                                                                            {option}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Condição</Label>
                                                            <Select
                                                                value={selectVal(item.condicao)}
                                                                onValueChange={(value) =>
                                                                    atualizarItem(index, {
                                                                        condicao:
                                                                            value === SELECT_VAZIO
                                                                                ? ''
                                                                                : value,
                                                                    })
                                                                }
                                                                disabled={item.material_id === ''}
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Selecione" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value={SELECT_VAZIO}>
                                                                        Não informado
                                                                    </SelectItem>
                                                                    {opcoesCondicao.map((option) => (
                                                                        <SelectItem
                                                                            key={option}
                                                                            value={option}
                                                                        >
                                                                            {option}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    {materialSelecionado && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Disponível na origem:{' '}
                                                            {materialSelecionado.quantidade_disponivel.toLocaleString(
                                                                'pt-BR',
                                                                {
                                                                    minimumFractionDigits: 0,
                                                                    maximumFractionDigits: 4,
                                                                },
                                                            )}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">
                                            Termo e observações
                                        </CardTitle>
                                        <CardDescription>
                                            Opcional: anexe o termo de recebimento e registre
                                            observações sobre esta transferência.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="termo_recebimento_transferencia">
                                                Termo de recebimento
                                            </Label>
                                            <Input
                                                id="termo_recebimento_transferencia"
                                                type="file"
                                                onChange={(event) =>
                                                    setTermoRecebimento(
                                                        event.target.files?.[0] ?? null,
                                                    )
                                                }
                                            />
                                            {termoRecebimento && (
                                                <p className="text-xs text-muted-foreground">
                                                    Arquivo selecionado: {termoRecebimento.name}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="observacoes_transferencia">
                                                Observações
                                            </Label>
                                            <textarea
                                                id="observacoes_transferencia"
                                                rows={4}
                                                value={observacoes}
                                                onChange={(event) =>
                                                    setObservacoes(event.target.value)
                                                }
                                                placeholder="Observações gerais da transferência"
                                                className={cn(
                                                    'flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs',
                                                    'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                                    'outline-none disabled:cursor-not-allowed disabled:opacity-50',
                                                )}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="flex min-h-0 flex-col overflow-hidden">
                                <Card className="flex min-h-0 flex-1 flex-col overflow-hidden md:sticky md:top-0">
                                    <CardHeader className="shrink-0">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <ClipboardList className="h-4 w-4" />
                                            Resumo geral
                                        </CardTitle>
                                        <CardDescription>
                                            Confira os dados antes de concluir a transferência.
                                        </CardDescription>
                                    </CardHeader>
                                <CardContent className="flex min-h-0 flex-1 flex-col space-y-4 overflow-y-auto overscroll-y-contain">
                                    <div className="rounded-lg border border-border/70 p-3 text-sm">
                                        <p className="font-medium text-muted-foreground">Origem</p>
                                        <p>{estoqueOrigem?.nome ?? 'Não selecionado'}</p>
                                    </div>
                                    <div className="rounded-lg border border-border/70 p-3 text-sm">
                                        <p className="font-medium text-muted-foreground">Destino</p>
                                        <p>{estoqueDestino?.nome ?? 'Não selecionado'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="rounded-lg border border-border/70 p-3 text-sm">
                                            <p className="font-medium text-muted-foreground">
                                                Itens
                                            </p>
                                            <p className="text-lg font-semibold">
                                                {resumo.totalItens}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-border/70 p-3 text-sm">
                                            <p className="font-medium text-muted-foreground">
                                                Quantidade
                                            </p>
                                            <p className="text-lg font-semibold">
                                                {resumo.totalQuantidade.toLocaleString('pt-BR', {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 4,
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-border/70 p-3 text-sm">
                                        <p className="font-medium text-muted-foreground">
                                            Termo de recebimento
                                        </p>
                                        <p>
                                            {termoRecebimento
                                                ? termoRecebimento.name
                                                : 'Nenhum arquivo anexado'}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-border/70 p-3 text-sm">
                                        <p className="font-medium text-muted-foreground">
                                            Observações
                                        </p>
                                        <p className="line-clamp-4 whitespace-pre-wrap wrap-break-word">
                                            {observacoes.trim() !== ''
                                                ? observacoes
                                                : '—'}
                                        </p>
                                    </div>
                                    <div className="space-y-2 rounded-lg border border-border/70 p-3">
                                        {itens.filter((item) => item.material_id !== '').length ===
                                        0 ? (
                                            <p className="text-sm text-muted-foreground">
                                                Nenhum item selecionado.
                                            </p>
                                        ) : (
                                            itens
                                                .filter((item) => item.material_id !== '')
                                                .map((item, index) => {
                                                    const material = mapaMateriais.get(
                                                        item.material_id,
                                                    );

                                                    return (
                                                        <div
                                                            key={`resumo-item-${index}`}
                                                            className="rounded-md border border-border/60 p-2 text-xs"
                                                        >
                                                            <p className="font-medium">
                                                                {material?.codigo ?? 'MAT'} -{' '}
                                                                {material?.descricao ?? 'Material'}
                                                            </p>
                                                            <p className="text-muted-foreground">
                                                                Qtd: {item.quantidade || '0'}
                                                            </p>
                                                        </div>
                                                    );
                                                })
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-end gap-2 border-t pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => aoMudarModal(false)}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit">
                                <Repeat className="mr-2 h-4 w-4" />
                                Confirmar transferência
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

