import { Head, router, usePage } from '@inertiajs/react';
import {
    ArrowRightLeft,
    ChevronDown,
    ChevronUp,
    ClipboardList,
    Clock3,
    EllipsisVertical,
    Eye,
    FileText,
    Plus,
    Repeat,
    Trash2,
    Warehouse,
} from 'lucide-react';
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const SELECT_VAZIO = '__none__';
const TRANSFERENCIAS_FILTROS_EXPANDIDOS_STORAGE_KEY =
    'transferencias:filtros-expandidos';

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
        itens: {
            id: number;
            material: string;
            empresa: string | null;
            local: string | null;
            numero_serie: string | null;
            condicao: string | null;
            quantidade: number;
        }[];
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
    const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
    const [transferenciaSelecionada, setTransferenciaSelecionada] = useState<
        Props['transferenciasRecentes'][number] | null
    >(null);
    const [filtroBusca, setFiltroBusca] = useState('');
    const [filtroOrigem, setFiltroOrigem] = useState('');
    const [filtroDestino, setFiltroDestino] = useState('');
    const [filtroUsuario, setFiltroUsuario] = useState('');
    const [filtroTermo, setFiltroTermo] = useState('');
    const [filtrosExpandidos, setFiltrosExpandidos] = useState<boolean>(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return (
            window.localStorage.getItem(
                TRANSFERENCIAS_FILTROS_EXPANDIDOS_STORAGE_KEY,
            ) === 'true'
        );
    });
    const colunaFormularioRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash?.success, flash?.error]);

    useEffect(() => {
        window.localStorage.setItem(
            TRANSFERENCIAS_FILTROS_EXPANDIDOS_STORAGE_KEY,
            String(filtrosExpandidos),
        );
    }, [filtrosExpandidos]);

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
        () =>
            estoques.find(
                (estoque) => String(estoque.id) === estoqueOrigemId,
            ) ?? null,
        [estoques, estoqueOrigemId],
    );

    const estoqueDestino = useMemo(
        () =>
            estoques.find(
                (estoque) => String(estoque.id) === estoqueDestinoId,
            ) ?? null,
        [estoques, estoqueDestinoId],
    );

    const resumo = useMemo(() => {
        const itensPreenchidos = itens.filter(
            (item) => item.material_id !== '',
        );
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

    const opcoesFiltro = useMemo(() => {
        const origens = Array.from(
            new Set(
                transferenciasRecentes
                    .map((t) => t.estoque_origem)
                    .filter(Boolean),
            ),
        ).sort((a, b) => a.localeCompare(b));
        const destinos = Array.from(
            new Set(
                transferenciasRecentes
                    .map((t) => t.estoque_destino)
                    .filter(Boolean),
            ),
        ).sort((a, b) => a.localeCompare(b));
        const usuarios = Array.from(
            new Set(
                transferenciasRecentes.map((t) => t.usuario).filter(Boolean),
            ),
        ).sort((a, b) => a.localeCompare(b));

        return { origens, destinos, usuarios };
    }, [transferenciasRecentes]);

    const transferenciasFiltradas = useMemo(() => {
        const buscaNormalizada = filtroBusca.trim().toLowerCase();

        return transferenciasRecentes.filter((transferencia) => {
            if (
                filtroOrigem !== '' &&
                transferencia.estoque_origem !== filtroOrigem
            ) {
                return false;
            }

            if (
                filtroDestino !== '' &&
                transferencia.estoque_destino !== filtroDestino
            ) {
                return false;
            }

            if (
                filtroUsuario !== '' &&
                transferencia.usuario !== filtroUsuario
            ) {
                return false;
            }

            if (filtroTermo === 'com_termo' && !transferencia.termo_url) {
                return false;
            }

            if (filtroTermo === 'sem_termo' && transferencia.termo_url) {
                return false;
            }

            if (buscaNormalizada === '') {
                return true;
            }

            const camposBusca = [
                `TRF-${String(transferencia.id).padStart(5, '0')}`,
                transferencia.estoque_origem,
                transferencia.estoque_destino,
                transferencia.usuario,
                transferencia.observacao ?? '',
                ...transferencia.itens.map((item) => item.material),
            ];

            return camposBusca.some((campo) =>
                campo.toLowerCase().includes(buscaNormalizada),
            );
        });
    }, [
        filtroBusca,
        filtroDestino,
        filtroOrigem,
        filtroTermo,
        filtroUsuario,
        transferenciasRecentes,
    ]);

    const atualizarItem = (
        index: number,
        patch: Partial<ItemTransferencia>,
    ) => {
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
                    container.scrollTop +
                    (targetRect.top - containerRect.top) -
                    8;

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
        key: keyof Pick<
            VinculoOption,
            'numero_serie' | 'local_nome' | 'empresa_nome' | 'condicao'
        >,
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
            movimentacao_item_origem_id: primeiroVinculo?.id
                ? String(primeiroVinculo.id)
                : '',
            numero_serie: primeiroVinculo?.numero_serie ?? '',
            local_id: primeiroVinculo?.local_id
                ? String(primeiroVinculo.local_id)
                : '',
            local: primeiroVinculo?.local_nome ?? '',
            empresa_id: primeiroVinculo?.empresa_id
                ? String(primeiroVinculo.empresa_id)
                : '',
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
                movimentacao_item_origem_id:
                    item.movimentacao_item_origem_id || '',
                empresa_id: item.empresa_id || '',
                local_id: item.local_id || '',
                numero_serie: item.numero_serie || '',
                condicao: item.condicao || '',
                quantidade: item.quantidade || '0',
            }));

        router.post(
            '/operacoes-estoque/transferencias',
            {
                estoque_origem_id: estoqueOrigemId,
                estoque_destino_id: estoqueDestinoId,
                observacao: observacoes,
                termo_recebimento: termoRecebimento,
                itens: itensPayload,
            },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => aoMudarModal(false),
                onError: () =>
                    toast.error('Não foi possível salvar a transferência.'),
            },
        );
    };

    const abrirModalDetalhes = (
        transferencia: Props['transferenciasRecentes'][number],
    ) => {
        setTransferenciaSelecionada(transferencia);
        setModalDetalhesAberto(true);
    };

    return (
        <>
            <Head title="Transferências de estoque" />

            <div className="space-y-6 p-4">
                <div className="rounded-2xl border border-primary/20 bg-linear-to-r from-primary/15 via-background to-primary/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                            <h1 className="text-xl font-semibold">
                                Transferências de estoque
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Selecione origem e destino, adicione itens e
                                confirme com resumo em tempo real.
                            </p>
                        </div>
                        <Button
                            type="button"
                            onClick={() => aoMudarModal(true)}
                        >
                            <ArrowRightLeft className="mr-2 h-4 w-4" />
                            Nova transferência
                        </Button>
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    <Card className="border-primary/20 bg-linear-to-r from-primary/15 via-background to-primary/5">
                        <CardContent className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Transferências recentes
                                </p>
                                <p className="text-2xl font-semibold">
                                    {indicadores.totalTransferencias}
                                </p>
                            </div>
                            <Clock3 className="h-5 w-5 text-primary" />
                        </CardContent>
                    </Card>
                    <Card className="border-primary/20 bg-linear-to-r from-primary/15 via-background to-primary/5">
                        <CardContent className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Quantidade movimentada
                                </p>
                                <p className="text-2xl font-semibold">
                                    {indicadores.totalQuantidade.toLocaleString(
                                        'pt-BR',
                                        {
                                            maximumFractionDigits: 4,
                                        },
                                    )}
                                </p>
                            </div>
                            <ArrowRightLeft className="h-5 w-5 text-primary" />
                        </CardContent>
                    </Card>
                    <Card className="border-primary/20 bg-linear-to-r from-primary/15 via-background to-primary/5">
                        <CardContent className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Estoques disponíveis
                                </p>
                                <p className="text-2xl font-semibold">
                                    {estoques.length}
                                </p>
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
                        <div className="mb-4 rounded-xl border border-primary/20 bg-linear-to-r from-primary/15 via-background to-primary/5 p-3 dark:border-primary/35 dark:bg-none dark:bg-[#1f2b44]">
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <p className="text-sm font-medium">Filtros</p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setFiltroBusca('');
                                            setFiltroOrigem('');
                                            setFiltroDestino('');
                                            setFiltroUsuario('');
                                            setFiltroTermo('');
                                        }}
                                    >
                                        Limpar filtros
                                    </Button>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full border border-border/70"
                                                    onClick={() =>
                                                        setFiltrosExpandidos(
                                                            (current) =>
                                                                !current,
                                                        )
                                                    }
                                                    aria-expanded={
                                                        filtrosExpandidos
                                                    }
                                                    aria-controls="painel-filtros-transferencias"
                                                    aria-label={
                                                        filtrosExpandidos
                                                            ? 'Minimizar filtros'
                                                            : 'Expandir filtros'
                                                    }
                                                >
                                                    {filtrosExpandidos ? (
                                                        <ChevronUp className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>
                                                    {filtrosExpandidos
                                                        ? 'Minimizar filtros'
                                                        : 'Expandir filtros'}
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </div>
                            <div
                                id="painel-filtros-transferencias"
                                className={cn(
                                    'grid overflow-hidden transition-all duration-300 ease-in-out',
                                    filtrosExpandidos
                                        ? 'mb-3 max-h-[500px] opacity-100'
                                        : 'max-h-0 opacity-0',
                                )}
                            >
                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                                    <div className="space-y-1">
                                        <Label>Busca</Label>
                                        <Input
                                            value={filtroBusca}
                                            onChange={(event) =>
                                                setFiltroBusca(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="TRF, observação, material..."
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Origem</Label>
                                        <Select
                                            value={selectVal(filtroOrigem)}
                                            onValueChange={(value) =>
                                                setFiltroOrigem(
                                                    value === SELECT_VAZIO
                                                        ? ''
                                                        : value,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Todas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem
                                                    value={SELECT_VAZIO}
                                                >
                                                    Todas
                                                </SelectItem>
                                                {opcoesFiltro.origens.map(
                                                    (origem) => (
                                                        <SelectItem
                                                            key={origem}
                                                            value={origem}
                                                        >
                                                            {origem}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Destino</Label>
                                        <Select
                                            value={selectVal(filtroDestino)}
                                            onValueChange={(value) =>
                                                setFiltroDestino(
                                                    value === SELECT_VAZIO
                                                        ? ''
                                                        : value,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Todos" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem
                                                    value={SELECT_VAZIO}
                                                >
                                                    Todos
                                                </SelectItem>
                                                {opcoesFiltro.destinos.map(
                                                    (destino) => (
                                                        <SelectItem
                                                            key={destino}
                                                            value={destino}
                                                        >
                                                            {destino}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Usuário</Label>
                                        <Select
                                            value={selectVal(filtroUsuario)}
                                            onValueChange={(value) =>
                                                setFiltroUsuario(
                                                    value === SELECT_VAZIO
                                                        ? ''
                                                        : value,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Todos" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem
                                                    value={SELECT_VAZIO}
                                                >
                                                    Todos
                                                </SelectItem>
                                                {opcoesFiltro.usuarios.map(
                                                    (usuario) => (
                                                        <SelectItem
                                                            key={usuario}
                                                            value={usuario}
                                                        >
                                                            {usuario}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Termo</Label>
                                        <Select
                                            value={selectVal(filtroTermo)}
                                            onValueChange={(value) =>
                                                setFiltroTermo(
                                                    value === SELECT_VAZIO
                                                        ? ''
                                                        : value,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Todos" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem
                                                    value={SELECT_VAZIO}
                                                >
                                                    Todos
                                                </SelectItem>
                                                <SelectItem value="com_termo">
                                                    Com termo
                                                </SelectItem>
                                                <SelectItem value="sem_termo">
                                                    Sem termo
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <p className="mt-3 text-xs text-muted-foreground">
                                Mostrando {transferenciasFiltradas.length} de{' '}
                                {transferenciasRecentes.length}{' '}
                                transferência(s).
                            </p>
                        </div>

                        {transferenciasRecentes.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">
                                Nenhuma transferência registrada.
                            </div>
                        ) : transferenciasFiltradas.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">
                                Nenhuma transferência encontrada com os filtros
                                aplicados.
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {transferenciasFiltradas.map(
                                    (transferencia) => (
                                        <Card
                                            key={transferencia.id}
                                            className="group relative overflow-hidden border-primary/45 bg-linear-to-r from-primary/15 via-background to-primary/5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-primary/35 dark:bg-none dark:bg-[#1f2b44]"
                                        >
                                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.35),transparent_48%)] dark:bg-none" />
                                            <CardHeader className="space-y-3 pb-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                                                        TRF-
                                                        {String(
                                                            transferencia.id,
                                                        ).padStart(5, '0')}
                                                    </p>
                                                    <div className="flex items-center gap-1">
                                                        <span className="rounded-full border border-primary/40 bg-primary/20 px-2 py-0.5 text-[11px] font-semibold text-primary dark:bg-[#1f2b44] dark:text-[#4ad0af]">
                                                            {transferencia.total_itens.toLocaleString(
                                                                'pt-BR',
                                                                {
                                                                    maximumFractionDigits: 4,
                                                                },
                                                            )}{' '}
                                                            itens
                                                        </span>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 rounded-full text-primary"
                                                                    aria-label="Abrir ações da transferência"
                                                                >
                                                                    <EllipsisVertical className="h-4 w-4 text-primary" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        abrirModalDetalhes(
                                                                            transferencia,
                                                                        )
                                                                    }
                                                                >
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    Ver
                                                                    transferência
                                                                </DropdownMenuItem>
                                                                {transferencia.termo_url ? (
                                                                    <DropdownMenuItem
                                                                        asChild
                                                                    >
                                                                        <a
                                                                            href={
                                                                                transferencia.termo_url
                                                                            }
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                        >
                                                                            <FileText className="mr-2 h-4 w-4" />
                                                                            Ver
                                                                            termo
                                                                            de
                                                                            recebimento
                                                                        </a>
                                                                    </DropdownMenuItem>
                                                                ) : (
                                                                    <DropdownMenuItem
                                                                        disabled
                                                                    >
                                                                        <FileText className="mr-2 h-4 w-4" />
                                                                        Termo
                                                                        não
                                                                        anexado
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                                <div className="rounded-lg border border-primary/30 bg-white/15 p-3 text-primary backdrop-blur-[1px] dark:bg-white/10">
                                                    <p className="text-xs text-[#1f2b44] dark:text-[#e1ff7d]">
                                                        Rota
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium text-primary">
                                                        {
                                                            transferencia.estoque_origem
                                                        }
                                                    </p>
                                                    <p className="-mb-0.5 text-[11px] leading-none text-[#1f2b44] dark:text-[#e1ff7d]">
                                                        para
                                                    </p>
                                                    <p className="text-sm font-medium text-primary">
                                                        {
                                                            transferencia.estoque_destino
                                                        }
                                                    </p>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-3 pt-0">
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div className="rounded-lg border border-primary/30 bg-white/12 p-2 text-primary backdrop-blur-[1px] dark:bg-white/10">
                                                        <p className="text-[#1f2b44] dark:text-[#e1ff7d]">
                                                            Usuário
                                                        </p>
                                                        <p className="mt-0.5 text-sm font-medium text-primary">
                                                            {
                                                                transferencia.usuario
                                                            }
                                                        </p>
                                                    </div>
                                                    <div className="rounded-lg border border-primary/30 bg-white/12 p-2 text-primary backdrop-blur-[1px] dark:bg-white/10">
                                                        <p className="text-[#1f2b44] dark:text-[#e1ff7d]">
                                                            Data
                                                        </p>
                                                        <p className="mt-0.5 text-sm font-medium text-primary">
                                                            {transferencia.created_at
                                                                ? new Date(
                                                                      transferencia.created_at,
                                                                  ).toLocaleString(
                                                                      'pt-BR',
                                                                  )
                                                                : '-'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="rounded-lg border border-primary/30 bg-white/12 p-2 text-primary backdrop-blur-[1px] dark:bg-white/10">
                                                    <p className="text-xs text-[#1f2b44] dark:text-[#e1ff7d]">
                                                        Observação
                                                    </p>
                                                    <p
                                                        className="line-clamp-2 text-sm wrap-break-word text-primary"
                                                        title={
                                                            transferencia.observacao ??
                                                            ''
                                                        }
                                                    >
                                                        {transferencia.observacao ??
                                                            '-'}
                                                    </p>
                                                </div>
                                                {transferencia.itens.length >
                                                    0 && (
                                                    <div className="space-y-2 rounded-lg border border-primary/30 bg-white/12 p-2 backdrop-blur-[1px] dark:bg-white/10">
                                                        <p className="text-xs text-[#1f2b44] dark:text-[#e1ff7d]">
                                                            Itens (prévia)
                                                        </p>
                                                        {transferencia.itens
                                                            .slice(0, 2)
                                                            .map((item) => (
                                                                <div
                                                                    key={
                                                                        item.id
                                                                    }
                                                                    className="rounded-md border border-primary/25 bg-white/10 p-2 text-xs backdrop-blur-[1px] dark:bg-white/8"
                                                                >
                                                                    <p className="font-medium text-primary">
                                                                        {
                                                                            item.material
                                                                        }
                                                                    </p>
                                                                    <div className="mt-1 grid gap-1 sm:grid-cols-2">
                                                                        <p className="text-primary/90">
                                                                            Série:{' '}
                                                                            <span className="font-medium text-primary">
                                                                                {item.numero_serie ||
                                                                                    '-'}
                                                                            </span>
                                                                        </p>
                                                                        <p className="text-primary/90">
                                                                            Empresa:{' '}
                                                                            <span className="font-medium text-primary">
                                                                                {item.empresa ||
                                                                                    '-'}
                                                                            </span>
                                                                        </p>
                                                                        <p className="text-primary/90">
                                                                            Local:{' '}
                                                                            <span className="font-medium text-primary">
                                                                                {item.local ||
                                                                                    '-'}
                                                                            </span>
                                                                        </p>
                                                                        <p className="text-primary/90">
                                                                            Condição:{' '}
                                                                            <span className="font-medium text-primary">
                                                                                {item.condicao ||
                                                                                    '-'}
                                                                            </span>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        {transferencia.itens
                                                            .length > 2 && (
                                                            <p className="text-[11px] text-primary/80">
                                                                +
                                                                {transferencia
                                                                    .itens
                                                                    .length -
                                                                    2}{' '}
                                                                item(ns)
                                                                adicionais. Use
                                                                "Ver
                                                                transferência"
                                                                para detalhes
                                                                completos.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="border-t border-border/60 pt-2" />
                                            </CardContent>
                                        </Card>
                                    ),
                                )}
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
                            Informe origem, destino e itens para montar a
                            transferência.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={onSubmit}
                        className="flex min-h-0 flex-col overflow-hidden"
                    >
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
                                        <CardTitle className="text-base">
                                            Origem e destino
                                        </CardTitle>
                                        <CardDescription>
                                            Escolha os estoques para
                                            movimentação. Origem e destino devem
                                            ser diferentes.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid gap-3 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Estoque de origem *</Label>
                                            <Select
                                                value={selectVal(
                                                    estoqueOrigemId,
                                                )}
                                                onValueChange={trocarOrigem}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Selecione a origem" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem
                                                        value={SELECT_VAZIO}
                                                        disabled
                                                    >
                                                        Selecione
                                                    </SelectItem>
                                                    {estoques.map((estoque) => (
                                                        <SelectItem
                                                            key={estoque.id}
                                                            value={String(
                                                                estoque.id,
                                                            )}
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
                                                value={selectVal(
                                                    estoqueDestinoId,
                                                )}
                                                onValueChange={trocarDestino}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Selecione o destino" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem
                                                        value={SELECT_VAZIO}
                                                        disabled
                                                    >
                                                        Selecione
                                                    </SelectItem>
                                                    {estoques
                                                        .filter(
                                                            (estoque) =>
                                                                String(
                                                                    estoque.id,
                                                                ) !==
                                                                estoqueOrigemId,
                                                        )
                                                        .map((estoque) => (
                                                            <SelectItem
                                                                key={estoque.id}
                                                                value={String(
                                                                    estoque.id,
                                                                )}
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
                                        <CardTitle className="text-base">
                                            Itens da transferência
                                        </CardTitle>
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
                                            const materialSelecionado =
                                                mapaMateriais.get(
                                                    item.material_id,
                                                );
                                            const opcoesSerie = opcoesCampo(
                                                item,
                                                'numero_serie',
                                            );
                                            const opcoesLocal = opcoesCampo(
                                                item,
                                                'local_nome',
                                            );
                                            const opcoesEmpresa = opcoesCampo(
                                                item,
                                                'empresa_nome',
                                            );
                                            const opcoesCondicao = opcoesCampo(
                                                item,
                                                'condicao',
                                            );

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
                                                                    setItens(
                                                                        (
                                                                            current,
                                                                        ) =>
                                                                            current.filter(
                                                                                (
                                                                                    _,
                                                                                    itemIndex,
                                                                                ) =>
                                                                                    itemIndex !==
                                                                                    index,
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
                                                            <Label>
                                                                Material *
                                                            </Label>
                                                            <Select
                                                                value={selectVal(
                                                                    item.material_id,
                                                                )}
                                                                onValueChange={(
                                                                    value,
                                                                ) =>
                                                                    trocarMaterialItem(
                                                                        index,
                                                                        value,
                                                                    )
                                                                }
                                                                disabled={
                                                                    estoqueOrigemId ===
                                                                    ''
                                                                }
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Selecione o material" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem
                                                                        value={
                                                                            SELECT_VAZIO
                                                                        }
                                                                        disabled
                                                                    >
                                                                        Selecione
                                                                    </SelectItem>
                                                                    {materiaisDaOrigem.map(
                                                                        (
                                                                            material,
                                                                        ) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    material.material_id
                                                                                }
                                                                                value={String(
                                                                                    material.material_id,
                                                                                )}
                                                                            >
                                                                                {
                                                                                    material.codigo
                                                                                }{' '}
                                                                                -{' '}
                                                                                {
                                                                                    material.descricao
                                                                                }
                                                                            </SelectItem>
                                                                        ),
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>
                                                                Quantidade *
                                                            </Label>
                                                            <Input
                                                                value={
                                                                    item.quantidade
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    atualizarItem(
                                                                        index,
                                                                        {
                                                                            quantidade:
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                        },
                                                                    )
                                                                }
                                                                placeholder="0"
                                                                inputMode="decimal"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                                        <div className="space-y-2">
                                                            <Label>
                                                                Número de série
                                                            </Label>
                                                            <Select
                                                                value={selectVal(
                                                                    item.numero_serie,
                                                                )}
                                                                onValueChange={(
                                                                    value,
                                                                ) =>
                                                                    trocarNumeroSerieItem(
                                                                        index,
                                                                        value,
                                                                    )
                                                                }
                                                                disabled={
                                                                    item.material_id ===
                                                                    ''
                                                                }
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Selecione" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem
                                                                        value={
                                                                            SELECT_VAZIO
                                                                        }
                                                                    >
                                                                        Não
                                                                        informado
                                                                    </SelectItem>
                                                                    {opcoesSerie.map(
                                                                        (
                                                                            option,
                                                                        ) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    option
                                                                                }
                                                                                value={
                                                                                    option
                                                                                }
                                                                            >
                                                                                {
                                                                                    option
                                                                                }
                                                                            </SelectItem>
                                                                        ),
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>
                                                                Empresa
                                                            </Label>
                                                            <Select
                                                                value={selectVal(
                                                                    item.empresa,
                                                                )}
                                                                onValueChange={(
                                                                    value,
                                                                ) => {
                                                                    const nextEmpresa =
                                                                        value ===
                                                                        SELECT_VAZIO
                                                                            ? ''
                                                                            : value;
                                                                    const material =
                                                                        mapaMateriais.get(
                                                                            item.material_id,
                                                                        );
                                                                    const vinculo =
                                                                        material?.vinculos.find(
                                                                            (
                                                                                v,
                                                                            ) =>
                                                                                (v.empresa_nome ??
                                                                                    '') ===
                                                                                nextEmpresa,
                                                                        );

                                                                    atualizarItem(
                                                                        index,
                                                                        {
                                                                            empresa:
                                                                                nextEmpresa,
                                                                            empresa_id:
                                                                                vinculo?.empresa_id
                                                                                    ? String(
                                                                                          vinculo.empresa_id,
                                                                                      )
                                                                                    : '',
                                                                        },
                                                                    );
                                                                }}
                                                                disabled={
                                                                    item.material_id ===
                                                                    ''
                                                                }
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Selecione" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem
                                                                        value={
                                                                            SELECT_VAZIO
                                                                        }
                                                                    >
                                                                        Não
                                                                        informado
                                                                    </SelectItem>
                                                                    {opcoesEmpresa.map(
                                                                        (
                                                                            option,
                                                                        ) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    option
                                                                                }
                                                                                value={
                                                                                    option
                                                                                }
                                                                            >
                                                                                {
                                                                                    option
                                                                                }
                                                                            </SelectItem>
                                                                        ),
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Local</Label>
                                                            <Select
                                                                value={selectVal(
                                                                    item.local,
                                                                )}
                                                                onValueChange={(
                                                                    value,
                                                                ) => {
                                                                    const nextLocal =
                                                                        value ===
                                                                        SELECT_VAZIO
                                                                            ? ''
                                                                            : value;
                                                                    const material =
                                                                        mapaMateriais.get(
                                                                            item.material_id,
                                                                        );
                                                                    const vinculo =
                                                                        material?.vinculos.find(
                                                                            (
                                                                                v,
                                                                            ) =>
                                                                                (v.local_nome ??
                                                                                    '') ===
                                                                                nextLocal,
                                                                        );

                                                                    atualizarItem(
                                                                        index,
                                                                        {
                                                                            local: nextLocal,
                                                                            local_id:
                                                                                vinculo?.local_id
                                                                                    ? String(
                                                                                          vinculo.local_id,
                                                                                      )
                                                                                    : '',
                                                                        },
                                                                    );
                                                                }}
                                                                disabled={
                                                                    item.material_id ===
                                                                    ''
                                                                }
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Selecione" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem
                                                                        value={
                                                                            SELECT_VAZIO
                                                                        }
                                                                    >
                                                                        Não
                                                                        informado
                                                                    </SelectItem>
                                                                    {opcoesLocal.map(
                                                                        (
                                                                            option,
                                                                        ) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    option
                                                                                }
                                                                                value={
                                                                                    option
                                                                                }
                                                                            >
                                                                                {
                                                                                    option
                                                                                }
                                                                            </SelectItem>
                                                                        ),
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>
                                                                Condição
                                                            </Label>
                                                            <Select
                                                                value={selectVal(
                                                                    item.condicao,
                                                                )}
                                                                onValueChange={(
                                                                    value,
                                                                ) =>
                                                                    atualizarItem(
                                                                        index,
                                                                        {
                                                                            condicao:
                                                                                value ===
                                                                                SELECT_VAZIO
                                                                                    ? ''
                                                                                    : value,
                                                                        },
                                                                    )
                                                                }
                                                                disabled={
                                                                    item.material_id ===
                                                                    ''
                                                                }
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Selecione" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem
                                                                        value={
                                                                            SELECT_VAZIO
                                                                        }
                                                                    >
                                                                        Não
                                                                        informado
                                                                    </SelectItem>
                                                                    {opcoesCondicao.map(
                                                                        (
                                                                            option,
                                                                        ) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    option
                                                                                }
                                                                                value={
                                                                                    option
                                                                                }
                                                                            >
                                                                                {
                                                                                    option
                                                                                }
                                                                            </SelectItem>
                                                                        ),
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    {materialSelecionado && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Disponível na
                                                            origem:{' '}
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
                                            Opcional: anexe o termo de
                                            recebimento e registre observações
                                            sobre esta transferência.
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
                                                        event.target
                                                            .files?.[0] ?? null,
                                                    )
                                                }
                                            />
                                            {termoRecebimento && (
                                                <p className="text-xs text-muted-foreground">
                                                    Arquivo selecionado:{' '}
                                                    {termoRecebimento.name}
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
                                                    setObservacoes(
                                                        event.target.value,
                                                    )
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
                                            Confira os dados antes de concluir a
                                            transferência.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex min-h-0 flex-1 flex-col space-y-4 overflow-y-auto overscroll-y-contain">
                                        <div className="rounded-lg border border-border/70 p-3 text-sm">
                                            <p className="font-medium text-muted-foreground">
                                                Origem
                                            </p>
                                            <p>
                                                {estoqueOrigem?.nome ??
                                                    'Não selecionado'}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-border/70 p-3 text-sm">
                                            <p className="font-medium text-muted-foreground">
                                                Destino
                                            </p>
                                            <p>
                                                {estoqueDestino?.nome ??
                                                    'Não selecionado'}
                                            </p>
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
                                                    {resumo.totalQuantidade.toLocaleString(
                                                        'pt-BR',
                                                        {
                                                            minimumFractionDigits: 0,
                                                            maximumFractionDigits: 4,
                                                        },
                                                    )}
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
                                            <p className="line-clamp-4 wrap-break-word whitespace-pre-wrap">
                                                {observacoes.trim() !== ''
                                                    ? observacoes
                                                    : '—'}
                                            </p>
                                        </div>
                                        <div className="space-y-2 rounded-lg border border-border/70 p-3">
                                            {itens.filter(
                                                (item) =>
                                                    item.material_id !== '',
                                            ).length === 0 ? (
                                                <p className="text-sm text-muted-foreground">
                                                    Nenhum item selecionado.
                                                </p>
                                            ) : (
                                                itens
                                                    .filter(
                                                        (item) =>
                                                            item.material_id !==
                                                            '',
                                                    )
                                                    .map((item, index) => {
                                                        const material =
                                                            mapaMateriais.get(
                                                                item.material_id,
                                                            );

                                                        return (
                                                            <div
                                                                key={`resumo-item-${index}`}
                                                                className="rounded-md border border-border/60 p-2 text-xs"
                                                            >
                                                                <p className="font-medium">
                                                                    {material?.codigo ??
                                                                        'MAT'}{' '}
                                                                    -{' '}
                                                                    {material?.descricao ??
                                                                        'Material'}
                                                                </p>
                                                                <p className="text-muted-foreground">
                                                                    Qtd:{' '}
                                                                    {item.quantidade ||
                                                                        '0'}
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

            <Dialog
                open={modalDetalhesAberto}
                onOpenChange={setModalDetalhesAberto}
            >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {transferenciaSelecionada
                                ? `Transferência TRF-${String(transferenciaSelecionada.id).padStart(5, '0')}`
                                : 'Detalhes da transferência'}
                        </DialogTitle>
                        <DialogDescription>
                            Visualize os dados completos da transferência
                            selecionada.
                        </DialogDescription>
                    </DialogHeader>

                    {transferenciaSelecionada && (
                        <div className="space-y-4">
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="rounded-lg border p-3 text-sm">
                                    <p className="text-xs text-muted-foreground">
                                        Origem
                                    </p>
                                    <p className="font-medium">
                                        {
                                            transferenciaSelecionada.estoque_origem
                                        }
                                    </p>
                                </div>
                                <div className="rounded-lg border p-3 text-sm">
                                    <p className="text-xs text-muted-foreground">
                                        Destino
                                    </p>
                                    <p className="font-medium">
                                        {
                                            transferenciaSelecionada.estoque_destino
                                        }
                                    </p>
                                </div>
                                <div className="rounded-lg border p-3 text-sm">
                                    <p className="text-xs text-muted-foreground">
                                        Usuário
                                    </p>
                                    <p className="font-medium">
                                        {transferenciaSelecionada.usuario}
                                    </p>
                                </div>
                                <div className="rounded-lg border p-3 text-sm">
                                    <p className="text-xs text-muted-foreground">
                                        Data
                                    </p>
                                    <p className="font-medium">
                                        {transferenciaSelecionada.created_at
                                            ? new Date(
                                                  transferenciaSelecionada.created_at,
                                              ).toLocaleString('pt-BR')
                                            : '-'}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-lg border p-3 text-sm">
                                <p className="text-xs text-muted-foreground">
                                    Observação
                                </p>
                                <p className="mt-1 wrap-break-word whitespace-pre-wrap">
                                    {transferenciaSelecionada.observacao ?? '-'}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium">
                                    Itens da transferência
                                </p>
                                {transferenciaSelecionada.itens.length === 0 ? (
                                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                        Nenhum item encontrado nesta
                                        transferência.
                                    </div>
                                ) : (
                                    <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                                        {transferenciaSelecionada.itens.map(
                                            (item) => (
                                                <div
                                                    key={item.id}
                                                    className="rounded-lg border p-3 text-sm"
                                                >
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <p className="font-medium">
                                                            {item.material}
                                                        </p>
                                                        <span className="rounded-full border bg-muted px-2 py-0.5 text-xs">
                                                            Qtd:{' '}
                                                            {item.quantidade.toLocaleString(
                                                                'pt-BR',
                                                                {
                                                                    maximumFractionDigits: 4,
                                                                },
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                                                        <div className="rounded-md border bg-muted/40 px-2 py-1">
                                                            <span className="text-muted-foreground">
                                                                Série:
                                                            </span>{' '}
                                                            <span className="font-medium text-foreground">
                                                                {item.numero_serie ||
                                                                    '-'}
                                                            </span>
                                                        </div>
                                                        <div className="rounded-md border bg-muted/40 px-2 py-1">
                                                            <span className="text-muted-foreground">
                                                                Empresa:
                                                            </span>{' '}
                                                            <span className="font-medium text-foreground">
                                                                {item.empresa ||
                                                                    '-'}
                                                            </span>
                                                        </div>
                                                        <div className="rounded-md border bg-muted/40 px-2 py-1">
                                                            <span className="text-muted-foreground">
                                                                Local:
                                                            </span>{' '}
                                                            <span className="font-medium text-foreground">
                                                                {item.local ||
                                                                    '-'}
                                                            </span>
                                                        </div>
                                                        <div className="rounded-md border bg-muted/40 px-2 py-1">
                                                            <span className="text-muted-foreground">
                                                                Condição:
                                                            </span>{' '}
                                                            <span className="font-medium text-foreground">
                                                                {item.condicao ||
                                                                    '-'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
