import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ClipboardList,
    DollarSign,
    FileText,
    Package,
    Plus,
    Trash2,
    Truck,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const BASE = '/operacoes-estoque/entradas-lote';
const POST_URL = `${BASE}`;
const SELECT_VAZIO = '__none__';

type CondicaoOption = { value: string; label: string };

type Option = { id: number; nome: string };
type TipoMat = { id: number; nome: string; rastreavel: boolean };
type MarcaOpt = { id: number; nome: string; tipo_material_id: number };
type ModeloMarcaOpt = { id: number; nome: string; marcas_id: number };
type EstoqueOpt = {
    id: number;
    nome: string;
    empresa_id: number;
    local_id: number;
    empresa: { id: number; nome: string } | null;
    local: { id: number; nome: string; codigo: string } | null;
};
type LocalOpt = {
    id: number;
    nome: string;
    codigo: string;
    empresa_id: number;
};
type FornecedorOpt = { id: number; nome: string; nome_fantasia: string | null };

type ItemLinha = {
    tipo_material_id: string;
    marca_id: string;
    modelo_marca_id: string;
    empresa_id: string;
    local_id: string;
    numero_serie: string;
    quantidade: string;
    valor_unitario: string;
    observacao: string;
    termo: File | null;
    fotos: File[];
};

export type NovaEntradaLoteProps = {
    tiposMateriais: TipoMat[];
    marcas: MarcaOpt[];
    modelosMarcas: ModeloMarcaOpt[];
    estoques: EstoqueOpt[];
    fornecedores: FornecedorOpt[];
    empresas: Option[];
    locais: LocalOpt[];
    condicoesEntrada: CondicaoOption[];
};

type EmbeddedProps = {
    embedded?: boolean;
    onRequestClose?: () => void;
    viewMode?: 'carousel' | 'normal';
};

const novoItem = (): ItemLinha => ({
    tipo_material_id: '',
    marca_id: '',
    modelo_marca_id: '',
    empresa_id: '',
    local_id: '',
    numero_serie: '',
    quantidade: '',
    valor_unitario: '',
    observacao: '',
    termo: null,
    fotos: [],
});

const exigeNotaFiscal = (condicao: string) =>
    condicao.includes('com_nota_fiscal');

const selectVal = (v: string) => (v === '' ? SELECT_VAZIO : v);

const formatBrl = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function NovaEntradaLote({
    tiposMateriais,
    marcas,
    modelosMarcas,
    estoques,
    fornecedores,
    empresas,
    locais,
    condicoesEntrada,
    embedded = false,
    onRequestClose,
    viewMode = 'carousel',
}: NovaEntradaLoteProps & EmbeddedProps) {
    const [condicaoEntrada, setCondicaoEntrada] = useState('');
    const [estoqueId, setEstoqueId] = useState('');
    const [observacao, setObservacao] = useState('');
    const [notaNumero, setNotaNumero] = useState('');
    const [notaDataEmissao, setNotaDataEmissao] = useState('');
    const [notaFornecedorId, setNotaFornecedorId] = useState('');
    const [notaArquivo, setNotaArquivo] = useState<File | null>(null);
    const [itens, setItens] = useState<ItemLinha[]>([novoItem()]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [showSairDialog, setShowSairDialog] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const mostrarNota = exigeNotaFiscal(condicaoEntrada);

    const totalLote = useMemo(() => {
        let q = 0;
        let v = 0;

        for (const it of itens) {
            const qq = parseFloat(it.quantidade.replace(',', '.')) || 0;
            const vu = parseFloat(it.valor_unitario.replace(',', '.')) || 0;
            q += qq;
            v += qq * vu;
        }

        return { quantidade: q, valor: v };
    }, [itens]);

    const totaisPorItem = useMemo(
        () =>
            itens.map((item, index) => {
                const quantidade =
                    parseFloat(item.quantidade.replace(',', '.')) || 0;
                const valorUnitario =
                    parseFloat(item.valor_unitario.replace(',', '.')) || 0;
                const total = quantidade * valorUnitario;

                return {
                    index,
                    quantidade,
                    valorUnitario,
                    total,
                    tipoNome:
                        tiposMateriais.find(
                            (t) => String(t.id) === item.tipo_material_id,
                        )?.nome ?? 'Tipo não selecionado',
                    marcaNome:
                        marcas.find((m) => String(m.id) === item.marca_id)
                            ?.nome ?? 'Marca não selecionada',
                    modeloNome:
                        modelosMarcas.find(
                            (m) => String(m.id) === item.modelo_marca_id,
                        )?.nome ?? 'Modelo não selecionado',
                };
            }),
        [itens, marcas, modelosMarcas, tiposMateriais],
    );

    const atualizarItem = (index: number, patch: Partial<ItemLinha>) => {
        setItens((rows) =>
            rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
        );
    };

    const adicionarItemComScroll = () => {
        const novoIndex = itens.length;

        setItens((rows) => [...rows, novoItem()]);

        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                const target = document.getElementById(
                    `item-entrada-${novoIndex}`,
                );

                if (!target) {
                    return;
                }

                target.scrollIntoView({
                    behavior: 'smooth',
                    block: isCarouselMode ? 'start' : 'nearest',
                    inline: 'nearest',
                });
            });
        });
    };

    const locaisPorEmpresa = (empresaId: string) => {
        if (empresaId === '') {
            return [];
        }

        return locais.filter((l) => String(l.empresa_id) === empresaId);
    };

    const marcasPorTipo = (tipoId: string) => {
        if (tipoId === '') {
            return [];
        }

        return marcas.filter((m) => String(m.tipo_material_id) === tipoId);
    };

    const modelosPorMarca = (marcaId: string) => {
        if (marcaId === '') {
            return [];
        }

        return modelosMarcas.filter((m) => String(m.marcas_id) === marcaId);
    };

    const tipoMaterialPorId = (tipoId: string) =>
        tiposMateriais.find((t) => String(t.id) === tipoId) ?? null;

    const tipoMaterialRastreavel = (tipoId: string) =>
        Boolean(tipoMaterialPorId(tipoId)?.rastreavel);

    const montarFormData = (): FormData => {
        const fd = new FormData();
        fd.append('condicao_entrada', condicaoEntrada);
        fd.append('estoque_id', estoqueId);

        if (observacao.trim()) {
            fd.append('observacao', observacao.trim());
        }

        if (mostrarNota) {
            fd.append('nota_numero', notaNumero.trim());

            if (notaDataEmissao) {
                fd.append('nota_data_emissao', notaDataEmissao);
            }

            if (notaFornecedorId !== '') {
                fd.append('nota_fornecedor_id', notaFornecedorId);
            }

            if (notaArquivo) {
                fd.append('nota_arquivo', notaArquivo);
            }
        }

        itens.forEach((it, i) => {
            const isRastreavel = tipoMaterialRastreavel(it.tipo_material_id);
            fd.append(`itens[${i}][tipo_material_id]`, it.tipo_material_id);
            fd.append(`itens[${i}][marca_id]`, it.marca_id);
            fd.append(`itens[${i}][modelo_marca_id]`, it.modelo_marca_id);

            if (it.empresa_id !== '') {
                fd.append(`itens[${i}][empresa_id]`, it.empresa_id);
            }

            if (it.local_id !== '') {
                fd.append(`itens[${i}][local_id]`, it.local_id);
            }

            fd.append(`itens[${i}][quantidade]`, isRastreavel ? '1' : it.quantidade.replace(',', '.'));
            fd.append(
                `itens[${i}][valor_unitario]`,
                it.valor_unitario.replace(',', '.'),
            );

            if (isRastreavel || it.numero_serie.trim()) {
                fd.append(`itens[${i}][numero_serie]`, it.numero_serie.trim());
            }

            if (it.observacao.trim()) {
                fd.append(`itens[${i}][observacao]`, it.observacao.trim());
            }

            if (it.termo) {
                fd.append(`itens[${i}][termo_recebimento]`, it.termo);
            }

            it.fotos.forEach((foto) => {
                fd.append(`itens[${i}][fotos][]`, foto);
            });
        });

        return fd;
    };

    const enviar = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (processing) {
            return;
        }

        setErrors({});
        setProcessing(true);
        const toastId = 'entrada-lote-submit';
        toast.loading('Entrada sendo cadastrada...', { id: toastId });

        router.post(POST_URL, montarFormData(), {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            replace: true,
            showProgress: false,
            onSuccess: () => {
                toast.success('Entrada concluída com sucesso.', { id: toastId });

                if (embedded) {
                    onRequestClose?.();
                }
            },
            onError: (errs) => {
                setErrors(errs as Record<string, string>);
                toast.error('Não foi possível concluir o cadastro da entrada.', {
                    id: toastId,
                });
            },
            onFinish: () => setProcessing(false),
        });
    };

    const primeiroErroGeral = () => {
        const keys = Object.keys(errors).filter((k) => !k.startsWith('itens.'));

        return keys.length ? errors[keys[0]!] : null;
    };

    const etapasCarousel = [
        { label: 'Condição da entrada', icon: ClipboardList },
        ...(mostrarNota ? [{ label: 'Nota fiscal', icon: FileText }] : []),
        { label: 'Dados da movimentação', icon: Truck },
        { label: 'Itens da entrada', icon: Package },
        { label: 'Total do lote', icon: DollarSign },
    ];
    const isCarouselMode = embedded && viewMode === 'carousel';
    const idxCondicao = 0;
    const idxNota = mostrarNota ? 1 : -1;
    const idxMovimentacao = mostrarNota ? 2 : 1;
    const idxItens = mostrarNota ? 3 : 2;
    const idxTotal = mostrarNota ? 4 : 3;
    const currentStepSafe = Math.min(currentStep, etapasCarousel.length - 1);
    const etapaVisivel = (index: number) => index === currentStepSafe;
    const ordemEtapa = (index: number) =>
        index === currentStepSafe ? 'order-1' : 'order-2';
    const classeAnimacaoEtapa = (index: number) =>
        cn(
            ordemEtapa(index),
            'transition-all duration-300 ease-out',
            index === currentStepSafe
                ? 'translate-y-0 opacity-100'
                : 'translate-y-1 opacity-85',
        );
    const fornecedorNotaSelecionado =
        fornecedores.find((f) => String(f.id) === notaFornecedorId)
            ?.nome_fantasia ||
        fornecedores.find((f) => String(f.id) === notaFornecedorId)?.nome ||
        'Não informado';
    const resumoEntradaBlocos = (
        <>
            <div className="grid grid-cols-1 gap-3">
                <div className="rounded-lg border border-border/60 bg-background px-3 py-2">
                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                        Condição
                    </p>
                    <p className="mt-1 font-medium">
                        {condicoesEntrada.find(
                            (c) => c.value === condicaoEntrada,
                        )?.label ?? 'Não selecionada'}
                    </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background px-3 py-2">
                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                        Estoque
                    </p>
                    <p className="mt-1 font-medium">
                        {estoques.find((e) => String(e.id) === estoqueId)
                            ?.nome ?? 'Não selecionado'}
                    </p>
                </div>
            </div>

            {mostrarNota && (
                <div className="space-y-3 rounded-lg border border-border/60 bg-background p-3">
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Nota fiscal
                    </p>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">
                                Número
                            </span>
                            <span
                                className="max-w-[60%] truncate text-right font-medium"
                                title={notaNumero.trim() || 'Não informado'}
                            >
                                {notaNumero.trim() || 'Não informado'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">
                                Emissão
                            </span>
                            <span className="font-medium">
                                {notaDataEmissao
                                    ? new Date(
                                          `${notaDataEmissao}T00:00:00`,
                                      ).toLocaleDateString('pt-BR')
                                    : 'Não informada'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">
                                Fornecedor
                            </span>
                            <span
                                className="max-w-[60%] truncate text-right font-medium"
                                title={fornecedorNotaSelecionado}
                            >
                                {fornecedorNotaSelecionado}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/60 bg-background px-3 py-2">
                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                        Itens
                    </p>
                    <p className="mt-1 text-lg font-semibold">{itens.length}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background px-3 py-2">
                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                        Quantidade
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                        {totalLote.quantidade.toLocaleString('pt-BR', {
                            maximumFractionDigits: 4,
                        })}
                    </p>
                </div>
            </div>

            <div className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-3">
                <p className="text-xs tracking-wide text-muted-foreground uppercase">
                    Valor total
                </p>
                <p className="mt-1 text-xl font-semibold text-primary">
                    {formatBrl(totalLote.valor)}
                </p>
            </div>
        </>
    );

    useEffect(() => {
        if (!isCarouselMode) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const isTypingTarget =
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target instanceof HTMLSelectElement ||
                target?.isContentEditable ||
                target?.getAttribute('role') === 'combobox';

            if (isTypingTarget) {
                return;
            }

            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setCurrentStep((prev) =>
                    Math.min(prev + 1, etapasCarousel.length - 1),
                );
            }

            if (event.key === 'ArrowUp') {
                event.preventDefault();
                setCurrentStep((prev) => Math.max(prev - 1, 0));
            }
        };

        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [isCarouselMode, etapasCarousel.length]);

    return (
        <>
            {!embedded && <Head title="Nova entrada em lote" />}

            <div
                className={
                    embedded
                        ? cn(
                              'h-full w-full space-y-6 p-0',
                              isCarouselMode
                                  ? 'overflow-hidden'
                                  : 'overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/70 [&::-webkit-scrollbar-track]:bg-transparent',
                          )
                        : 'mx-auto max-w-5xl space-y-6 p-4'
                }
            >
                {!embedded && (
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="mb-2 -ml-2"
                                asChild
                            >
                                <Link href={BASE}>
                                    <ArrowLeft className="mr-1 h-4 w-4" />
                                    Voltar à lista
                                </Link>
                            </Button>
                            <h1 className="text-lg font-semibold">
                                Nova entrada em lote
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Preencha a condição da entrada, o estoque de
                                destino e os itens. Use cancelar para sair com
                                confirmação se já houver dados.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowSairDialog(true)}
                        >
                            Cancelar entrada
                        </Button>
                    </div>
                )}

                {primeiroErroGeral() && (
                    <div
                        className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                        role="alert"
                    >
                        {primeiroErroGeral()}
                    </div>
                )}

                <form
                    className={cn(
                        'space-y-6',
                        embedded &&
                            (isCarouselMode
                                ? 'h-full overflow-hidden'
                                : 'h-auto'),
                    )}
                    onSubmit={enviar}
                >
                    {isCarouselMode ? (
                        <div className="grid h-full min-h-0 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                            <div className="flex h-full min-h-0 min-w-0 flex-col gap-4">
                                <div className="grid h-[70vh] items-stretch gap-2 md:grid-cols-[40px_minmax(0,1fr)]">
                                    <div className="flex h-full flex-col items-center justify-center gap-2">
                                        {etapasCarousel.map((etapa, index) => (
                                            <Tooltip key={etapa.label}>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setCurrentStep(
                                                                index,
                                                            )
                                                        }
                                                        className={cn(
                                                            'flex h-9 w-9 items-center justify-center rounded-full border',
                                                            currentStepSafe ===
                                                                index
                                                                ? 'border-primary bg-primary/10 text-primary'
                                                                : 'border-border text-muted-foreground hover:bg-muted',
                                                        )}
                                                        aria-label={`Ir para ${etapa.label}`}
                                                    >
                                                        <etapa.icon className="h-4 w-4" />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent side="right">
                                                    <p>{etapa.label}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        ))}
                                    </div>

                                    <div className="flex h-full min-h-0 min-w-0 flex-col gap-4 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/70 [&::-webkit-scrollbar-track]:bg-transparent">
                                        {etapaVisivel(idxCondicao) && (
                                            <div
                                                className={classeAnimacaoEtapa(
                                                    idxCondicao,
                                                )}
                                            >
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle>
                                                            Condição da entrada
                                                        </CardTitle>
                                                        <CardDescription>
                                                            Define se a
                                                            mercadoria é nova ou
                                                            usada e se há nota
                                                            fiscal.
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="space-y-2">
                                                        <Label htmlFor="condicao_entrada">
                                                            Tipo de entrada *
                                                        </Label>
                                                        <Select
                                                            value={selectVal(
                                                                condicaoEntrada,
                                                            )}
                                                            onValueChange={(
                                                                v,
                                                            ) =>
                                                                setCondicaoEntrada(
                                                                    v ===
                                                                        SELECT_VAZIO
                                                                        ? ''
                                                                        : v,
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger
                                                                id="condicao_entrada"
                                                                className="w-full"
                                                            >
                                                                <SelectValue placeholder="Selecione" />
                                                            </SelectTrigger>
                                                            <SelectContent position="popper">
                                                                <SelectItem
                                                                    value={
                                                                        SELECT_VAZIO
                                                                    }
                                                                    disabled
                                                                >
                                                                    Selecione
                                                                </SelectItem>
                                                                {condicoesEntrada.map(
                                                                    (c) => (
                                                                        <SelectItem
                                                                            key={
                                                                                c.value
                                                                            }
                                                                            value={
                                                                                c.value
                                                                            }
                                                                        >
                                                                            {
                                                                                c.label
                                                                            }
                                                                        </SelectItem>
                                                                    ),
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                        {errors.condicao_entrada && (
                                                            <p className="text-xs text-destructive">
                                                                {
                                                                    errors.condicao_entrada
                                                                }
                                                            </p>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        )}

                                        {mostrarNota &&
                                            etapaVisivel(idxNota) && (
                                                <div
                                                    className={classeAnimacaoEtapa(
                                                        idxNota,
                                                    )}
                                                >
                                                    <Card>
                                                        <CardHeader>
                                                            <CardTitle>
                                                                Dados da nota
                                                                fiscal
                                                            </CardTitle>
                                                            <CardDescription>
                                                                Campos exibidos
                                                                quando a
                                                                condição exige
                                                                nota fiscal.
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="grid gap-4 sm:grid-cols-2">
                                                            <div className="space-y-2 sm:col-span-2">
                                                                <Label htmlFor="nota_numero">
                                                                    Número da
                                                                    nota *
                                                                </Label>
                                                                <Input
                                                                    id="nota_numero"
                                                                    value={
                                                                        notaNumero
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setNotaNumero(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                                {errors.nota_numero && (
                                                                    <p className="text-xs text-destructive">
                                                                        {
                                                                            errors.nota_numero
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="nota_data_emissao">
                                                                    Data de
                                                                    emissão
                                                                </Label>
                                                                <Input
                                                                    id="nota_data_emissao"
                                                                    type="date"
                                                                    value={
                                                                        notaDataEmissao
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setNotaDataEmissao(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                                {errors.nota_data_emissao && (
                                                                    <p className="text-xs text-destructive">
                                                                        {
                                                                            errors.nota_data_emissao
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="nota_fornecedor">
                                                                    Fornecedor
                                                                </Label>
                                                                <Select
                                                                    value={selectVal(
                                                                        notaFornecedorId,
                                                                    )}
                                                                    onValueChange={(
                                                                        v,
                                                                    ) =>
                                                                        setNotaFornecedorId(
                                                                            v ===
                                                                                SELECT_VAZIO
                                                                                ? ''
                                                                                : v,
                                                                        )
                                                                    }
                                                                >
                                                                    <SelectTrigger
                                                                        id="nota_fornecedor"
                                                                        className="w-full"
                                                                    >
                                                                        <SelectValue placeholder="Opcional" />
                                                                    </SelectTrigger>
                                                                    <SelectContent position="popper">
                                                                        <SelectItem
                                                                            value={
                                                                                SELECT_VAZIO
                                                                            }
                                                                        >
                                                                            Nenhum
                                                                        </SelectItem>
                                                                        {fornecedores.map(
                                                                            (
                                                                                f,
                                                                            ) => (
                                                                                <SelectItem
                                                                                    key={
                                                                                        f.id
                                                                                    }
                                                                                    value={String(
                                                                                        f.id,
                                                                                    )}
                                                                                >
                                                                                    {f.nome_fantasia ||
                                                                                        f.nome}
                                                                                </SelectItem>
                                                                            ),
                                                                        )}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-2 sm:col-span-2">
                                                                <Label htmlFor="nota_arquivo">
                                                                    Arquivo da
                                                                    nota fiscal
                                                                </Label>
                                                                <Input
                                                                    id="nota_arquivo"
                                                                    type="file"
                                                                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setNotaArquivo(
                                                                            e
                                                                                .target
                                                                                .files?.[0] ??
                                                                                null,
                                                                        )
                                                                    }
                                                                />
                                                                {errors.nota_arquivo && (
                                                                    <p className="text-xs text-destructive">
                                                                        {
                                                                            errors.nota_arquivo
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            )}

                                        {etapaVisivel(idxMovimentacao) && (
                                            <div
                                                className={classeAnimacaoEtapa(
                                                    idxMovimentacao,
                                                )}
                                            >
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle>
                                                            Dados da
                                                            movimentação
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="estoque_id">
                                                                Estoque de
                                                                destino *
                                                            </Label>
                                                            <Select
                                                                value={selectVal(
                                                                    estoqueId,
                                                                )}
                                                                onValueChange={(
                                                                    v,
                                                                ) =>
                                                                    setEstoqueId(
                                                                        v ===
                                                                            SELECT_VAZIO
                                                                            ? ''
                                                                            : v,
                                                                    )
                                                                }
                                                            >
                                                                <SelectTrigger
                                                                    id="estoque_id"
                                                                    className="w-full"
                                                                >
                                                                    <SelectValue placeholder="Selecione o estoque" />
                                                                </SelectTrigger>
                                                                <SelectContent position="popper">
                                                                    <SelectItem
                                                                        value={
                                                                            SELECT_VAZIO
                                                                        }
                                                                        disabled
                                                                    >
                                                                        Selecione
                                                                    </SelectItem>
                                                                    {estoques.map(
                                                                        (e) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    e.id
                                                                                }
                                                                                value={String(
                                                                                    e.id,
                                                                                )}
                                                                            >
                                                                                {
                                                                                    e.nome
                                                                                }
                                                                                {e.empresa
                                                                                    ? ` — ${e.empresa.nome}`
                                                                                    : ''}
                                                                            </SelectItem>
                                                                        ),
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                            {errors.estoque_id && (
                                                                <p className="text-xs text-destructive">
                                                                    {
                                                                        errors.estoque_id
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="observacao">
                                                                Observações
                                                                gerais
                                                            </Label>
                                                            <textarea
                                                                id="observacao"
                                                                rows={3}
                                                                value={
                                                                    observacao
                                                                }
                                                                onChange={(e) =>
                                                                    setObservacao(
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
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
                                        )}

                                        {etapaVisivel(idxItens) && (
                                            <div
                                                className={classeAnimacaoEtapa(
                                                    idxItens,
                                                )}
                                            >
                                                <Card>
                                                    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
                                                        <div>
                                                            <CardTitle>
                                                                Itens da entrada
                                                            </CardTitle>
                                                            <CardDescription>
                                                                Tipo de
                                                                material, marca,
                                                                empresa/local do
                                                                item,
                                                                quantidades e
                                                                anexos
                                                                opcionais.
                                                            </CardDescription>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={
                                                                adicionarItemComScroll
                                                            }
                                                        >
                                                            <Plus className="mr-1 h-4 w-4" />
                                                            Adicionar item
                                                        </Button>
                                                    </CardHeader>
                                                    <CardContent className="space-y-6">
                                                        {errors.itens && (
                                                            <p className="text-sm text-destructive">
                                                                {errors.itens}
                                                            </p>
                                                        )}
                                                        {itens.map(
                                                            (item, index) => (
                                                                <div
                                                                    key={index}
                                                                    id={`item-entrada-${index}`}
                                                                    className="space-y-4 rounded-lg border border-border p-4"
                                                                >
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <span className="text-sm font-medium">
                                                                            Item{' '}
                                                                            {index +
                                                                                1}
                                                                        </span>
                                                                        {itens.length >
                                                                            1 && (
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 text-destructive"
                                                                                onClick={() =>
                                                                                    setItens(
                                                                                        (
                                                                                            rows,
                                                                                        ) =>
                                                                                            rows.filter(
                                                                                                (
                                                                                                    _,
                                                                                                    i,
                                                                                                ) =>
                                                                                                    i !==
                                                                                                    index,
                                                                                            ),
                                                                                    )
                                                                                }
                                                                                aria-label={`Remover item ${index + 1}`}
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                    <div className="grid gap-3 sm:grid-cols-2">
                                                                        <div className="space-y-2">
                                                                            <Label>
                                                                                Tipo
                                                                                de
                                                                                material
                                                                                *
                                                                            </Label>
                                                                            <Select
                                                                                value={selectVal(
                                                                                    item.tipo_material_id,
                                                                                )}
                                                                                onValueChange={(
                                                                                    v,
                                                                                ) => {
                                                                                    const next =
                                                                                        v ===
                                                                                        SELECT_VAZIO
                                                                                            ? ''
                                                                                            : v;
                                                                                    atualizarItem(
                                                                                        index,
                                                                                        {
                                                                                            tipo_material_id:
                                                                                                next,
                                                                                            marca_id:
                                                                                                '',
                                                                                            modelo_marca_id:
                                                                                                '',
                                                                                            numero_serie:
                                                                                                '',
                                                                                            quantidade:
                                                                                                tipoMaterialRastreavel(
                                                                                                    next,
                                                                                                )
                                                                                                    ? '1'
                                                                                                    : '',
                                                                                        },
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <SelectTrigger className="w-full">
                                                                                    <SelectValue placeholder="Selecione" />
                                                                                </SelectTrigger>
                                                                                <SelectContent position="popper">
                                                                                    <SelectItem
                                                                                        value={
                                                                                            SELECT_VAZIO
                                                                                        }
                                                                                        disabled
                                                                                    >
                                                                                        Selecione
                                                                                    </SelectItem>
                                                                                    {tiposMateriais.map(
                                                                                        (
                                                                                            t,
                                                                                        ) => (
                                                                                            <SelectItem
                                                                                                key={
                                                                                                    t.id
                                                                                                }
                                                                                                value={String(
                                                                                                    t.id,
                                                                                                )}
                                                                                            >
                                                                                                {
                                                                                                    t.nome
                                                                                                }
                                                                                            </SelectItem>
                                                                                        ),
                                                                                    )}
                                                                                </SelectContent>
                                                                            </Select>
                                                                            {errors[
                                                                                `itens.${index}.tipo_material_id`
                                                                            ] && (
                                                                                <p className="text-xs text-destructive">
                                                                                    {
                                                                                        errors[
                                                                                            `itens.${index}.tipo_material_id`
                                                                                        ]
                                                                                    }
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label>
                                                                                Marca *
                                                                            </Label>
                                                                            <Select
                                                                                value={selectVal(
                                                                                    item.marca_id,
                                                                                )}
                                                                                onValueChange={(
                                                                                    v,
                                                                                ) =>
                                                                                    atualizarItem(
                                                                                        index,
                                                                                        {
                                                                                            marca_id:
                                                                                                v ===
                                                                                                SELECT_VAZIO
                                                                                                    ? ''
                                                                                                    : v,
                                                                                            modelo_marca_id:
                                                                                                '',
                                                                                        },
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    item.tipo_material_id ===
                                                                                    ''
                                                                                }
                                                                            >
                                                                                <SelectTrigger className="w-full">
                                                                                    <SelectValue
                                                                                        placeholder={
                                                                                            item.tipo_material_id ===
                                                                                            ''
                                                                                                ? 'Selecione o tipo primeiro'
                                                                                                : 'Selecione a marca'
                                                                                        }
                                                                                    />
                                                                                </SelectTrigger>
                                                                                <SelectContent position="popper">
                                                                                    <SelectItem
                                                                                        value={
                                                                                            SELECT_VAZIO
                                                                                        }
                                                                                        disabled
                                                                                    >
                                                                                        Selecione
                                                                                    </SelectItem>
                                                                                    {marcasPorTipo(
                                                                                        item.tipo_material_id,
                                                                                    ).map(
                                                                                        (
                                                                                            m,
                                                                                        ) => (
                                                                                            <SelectItem
                                                                                                key={
                                                                                                    m.id
                                                                                                }
                                                                                                value={String(
                                                                                                    m.id,
                                                                                                )}
                                                                                            >
                                                                                                {
                                                                                                    m.nome
                                                                                                }
                                                                                            </SelectItem>
                                                                                        ),
                                                                                    )}
                                                                                </SelectContent>
                                                                            </Select>
                                                                            {errors[
                                                                                `itens.${index}.marca_id`
                                                                            ] && (
                                                                                <p className="text-xs text-destructive">
                                                                                    {
                                                                                        errors[
                                                                                            `itens.${index}.marca_id`
                                                                                        ]
                                                                                    }
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label>
                                                                                Modelo
                                                                                *
                                                                            </Label>
                                                                            <Select
                                                                                value={selectVal(
                                                                                    item.modelo_marca_id,
                                                                                )}
                                                                                onValueChange={(
                                                                                    v,
                                                                                ) =>
                                                                                    atualizarItem(
                                                                                        index,
                                                                                        {
                                                                                            modelo_marca_id:
                                                                                                v ===
                                                                                                SELECT_VAZIO
                                                                                                    ? ''
                                                                                                    : v,
                                                                                        },
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    item.marca_id ===
                                                                                    ''
                                                                                }
                                                                            >
                                                                                <SelectTrigger className="w-full">
                                                                                    <SelectValue
                                                                                        placeholder={
                                                                                            item.marca_id ===
                                                                                            ''
                                                                                                ? 'Selecione a marca primeiro'
                                                                                                : 'Selecione o modelo'
                                                                                        }
                                                                                    />
                                                                                </SelectTrigger>
                                                                                <SelectContent position="popper">
                                                                                    <SelectItem
                                                                                        value={
                                                                                            SELECT_VAZIO
                                                                                        }
                                                                                        disabled
                                                                                    >
                                                                                        Selecione
                                                                                    </SelectItem>
                                                                                    {modelosPorMarca(
                                                                                        item.marca_id,
                                                                                    ).map(
                                                                                        (
                                                                                            modelo,
                                                                                        ) => (
                                                                                            <SelectItem
                                                                                                key={
                                                                                                    modelo.id
                                                                                                }
                                                                                                value={String(
                                                                                                    modelo.id,
                                                                                                )}
                                                                                            >
                                                                                                {
                                                                                                    modelo.nome
                                                                                                }
                                                                                            </SelectItem>
                                                                                        ),
                                                                                    )}
                                                                                </SelectContent>
                                                                            </Select>
                                                                            {errors[
                                                                                `itens.${index}.modelo_marca_id`
                                                                            ] && (
                                                                                <p className="text-xs text-destructive">
                                                                                    {
                                                                                        errors[
                                                                                            `itens.${index}.modelo_marca_id`
                                                                                        ]
                                                                                    }
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label>
                                                                                Empresa
                                                                            </Label>
                                                                            <Select
                                                                                value={selectVal(
                                                                                    item.empresa_id,
                                                                                )}
                                                                                onValueChange={(
                                                                                    v,
                                                                                ) => {
                                                                                    const next =
                                                                                        v ===
                                                                                        SELECT_VAZIO
                                                                                            ? ''
                                                                                            : v;
                                                                                    atualizarItem(
                                                                                        index,
                                                                                        {
                                                                                            empresa_id:
                                                                                                next,
                                                                                            local_id:
                                                                                                '',
                                                                                        },
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <SelectTrigger className="w-full">
                                                                                    <SelectValue placeholder="Opcional" />
                                                                                </SelectTrigger>
                                                                                <SelectContent position="popper">
                                                                                    <SelectItem
                                                                                        value={
                                                                                            SELECT_VAZIO
                                                                                        }
                                                                                    >
                                                                                        Nenhuma
                                                                                    </SelectItem>
                                                                                    {empresas.map(
                                                                                        (
                                                                                            e,
                                                                                        ) => (
                                                                                            <SelectItem
                                                                                                key={
                                                                                                    e.id
                                                                                                }
                                                                                                value={String(
                                                                                                    e.id,
                                                                                                )}
                                                                                            >
                                                                                                {
                                                                                                    e.nome
                                                                                                }
                                                                                            </SelectItem>
                                                                                        ),
                                                                                    )}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label>
                                                                                Local
                                                                            </Label>
                                                                            <Select
                                                                                value={selectVal(
                                                                                    item.local_id,
                                                                                )}
                                                                                onValueChange={(
                                                                                    v,
                                                                                ) =>
                                                                                    atualizarItem(
                                                                                        index,
                                                                                        {
                                                                                            local_id:
                                                                                                v ===
                                                                                                SELECT_VAZIO
                                                                                                    ? ''
                                                                                                    : v,
                                                                                        },
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    item.empresa_id ===
                                                                                    ''
                                                                                }
                                                                            >
                                                                                <SelectTrigger className="w-full">
                                                                                    <SelectValue
                                                                                        placeholder={
                                                                                            item.empresa_id ===
                                                                                            ''
                                                                                                ? 'Selecione empresa'
                                                                                                : 'Opcional'
                                                                                        }
                                                                                    />
                                                                                </SelectTrigger>
                                                                                <SelectContent position="popper">
                                                                                    <SelectItem
                                                                                        value={
                                                                                            SELECT_VAZIO
                                                                                        }
                                                                                    >
                                                                                        Nenhum
                                                                                    </SelectItem>
                                                                                    {locaisPorEmpresa(
                                                                                        item.empresa_id,
                                                                                    ).map(
                                                                                        (
                                                                                            l,
                                                                                        ) => (
                                                                                            <SelectItem
                                                                                                key={
                                                                                                    l.id
                                                                                                }
                                                                                                value={String(
                                                                                                    l.id,
                                                                                                )}
                                                                                            >
                                                                                                {
                                                                                                    l.nome
                                                                                                }{' '}
                                                                                                (
                                                                                                {
                                                                                                    l.codigo
                                                                                                }

                                                                                                )
                                                                                            </SelectItem>
                                                                                        ),
                                                                                    )}
                                                                                </SelectContent>
                                                                            </Select>
                                                                            {errors[
                                                                                `itens.${index}.local_id`
                                                                            ] && (
                                                                                <p className="text-xs text-destructive">
                                                                                    {
                                                                                        errors[
                                                                                            `itens.${index}.local_id`
                                                                                        ]
                                                                                    }
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        {item.tipo_material_id !== '' &&
                                                                            tipoMaterialRastreavel(
                                                                                item.tipo_material_id,
                                                                            ) && (
                                                                                <div className="space-y-2">
                                                                                    <Label>
                                                                                        Número de
                                                                                        série *
                                                                                    </Label>
                                                                                    <Input
                                                                                        value={
                                                                                            item.numero_serie
                                                                                        }
                                                                                        onChange={(
                                                                                            e,
                                                                                        ) =>
                                                                                            atualizarItem(
                                                                                                index,
                                                                                                {
                                                                                                    numero_serie:
                                                                                                        e
                                                                                                            .target
                                                                                                            .value,
                                                                                                },
                                                                                            )
                                                                                        }
                                                                                        placeholder="Informe o número de série"
                                                                                    />
                                                                                    {errors[
                                                                                        `itens.${index}.numero_serie`
                                                                                    ] && (
                                                                                        <p className="text-xs text-destructive">
                                                                                            {
                                                                                                errors[
                                                                                                    `itens.${index}.numero_serie`
                                                                                                ]
                                                                                            }
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        <div className="space-y-2">
                                                                            <Label>
                                                                                Quantidade
                                                                                *
                                                                            </Label>
                                                                            <Input
                                                                                inputMode="decimal"
                                                                                value={
                                                                                    item.quantidade
                                                                                }
                                                                                disabled={tipoMaterialRastreavel(
                                                                                    item.tipo_material_id,
                                                                                )}
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    atualizarItem(
                                                                                        index,
                                                                                        {
                                                                                            quantidade:
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                        },
                                                                                    )
                                                                                }
                                                                            />
                                                                            {tipoMaterialRastreavel(
                                                                                item.tipo_material_id,
                                                                            ) && (
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    Materiais rastreáveis sempre registram quantidade fixa igual a 1.
                                                                                </p>
                                                                            )}
                                                                            {errors[
                                                                                `itens.${index}.quantidade`
                                                                            ] && (
                                                                                <p className="text-xs text-destructive">
                                                                                    {
                                                                                        errors[
                                                                                            `itens.${index}.quantidade`
                                                                                        ]
                                                                                    }
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label>
                                                                                Valor
                                                                                unitário
                                                                                *
                                                                            </Label>
                                                                            <Input
                                                                                inputMode="decimal"
                                                                                value={
                                                                                    item.valor_unitario
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    atualizarItem(
                                                                                        index,
                                                                                        {
                                                                                            valor_unitario:
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                        },
                                                                                    )
                                                                                }
                                                                            />
                                                                            {errors[
                                                                                `itens.${index}.valor_unitario`
                                                                            ] && (
                                                                                <p className="text-xs text-destructive">
                                                                                    {
                                                                                        errors[
                                                                                            `itens.${index}.valor_unitario`
                                                                                        ]
                                                                                    }
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        <div className="space-y-2 sm:col-span-2">
                                                                            <Label>
                                                                                Observação
                                                                                do
                                                                                item
                                                                            </Label>
                                                                            <Input
                                                                                value={
                                                                                    item.observacao
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    atualizarItem(
                                                                                        index,
                                                                                        {
                                                                                            observacao:
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                        },
                                                                                    )
                                                                                }
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label>
                                                                                Termo
                                                                                de
                                                                                recebimento
                                                                            </Label>
                                                                            <Input
                                                                                type="file"
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    atualizarItem(
                                                                                        index,
                                                                                        {
                                                                                            termo:
                                                                                                e
                                                                                                    .target
                                                                                                    .files?.[0] ??
                                                                                                null,
                                                                                        },
                                                                                    )
                                                                                }
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label>
                                                                                Fotos
                                                                            </Label>
                                                                            <Input
                                                                                type="file"
                                                                                multiple
                                                                                accept="image/*"
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    atualizarItem(
                                                                                        index,
                                                                                        {
                                                                                            fotos: e
                                                                                                .target
                                                                                                .files
                                                                                                ? Array.from(
                                                                                                      e
                                                                                                          .target
                                                                                                          .files,
                                                                                                  )
                                                                                                : [],
                                                                                        },
                                                                                    )
                                                                                }
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )}
                                                        <div className="flex justify-end">
                                                            <Button
                                                                type="button"
                                                                variant="secondary"
                                                                size="sm"
                                                                onClick={
                                                                    adicionarItemComScroll
                                                                }
                                                            >
                                                                <Plus className="mr-1 h-4 w-4" />
                                                                Adicionar item
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        )}

                                        {etapaVisivel(idxTotal) && (
                                            <div
                                                className={classeAnimacaoEtapa(
                                                    idxTotal,
                                                )}
                                            >
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle>
                                                            Total do lote
                                                        </CardTitle>
                                                        <CardDescription>
                                                            Soma automática dos
                                                            itens.
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4 text-sm">
                                                        <div className="flex flex-wrap gap-8">
                                                            <div>
                                                                <p className="text-muted-foreground">
                                                                    Quantidade
                                                                    total
                                                                </p>
                                                                <p className="text-lg font-semibold">
                                                                    {totalLote.quantidade.toLocaleString(
                                                                        'pt-BR',
                                                                        {
                                                                            maximumFractionDigits: 4,
                                                                        },
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-muted-foreground">
                                                                    Valor total
                                                                </p>
                                                                <p className="text-lg font-semibold">
                                                                    {formatBrl(
                                                                        totalLote.valor,
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <p className="text-sm font-medium">
                                                                Total por item
                                                            </p>
                                                            <div className="space-y-2">
                                                                {totaisPorItem.map(
                                                                    (item) => (
                                                                        <div
                                                                            key={
                                                                                item.index
                                                                            }
                                                                            className="rounded-md border border-border/60 bg-muted/20 px-3 py-2"
                                                                        >
                                                                            <p className="text-sm font-medium">
                                                                                Item{' '}
                                                                                {item.index +
                                                                                    1}{' '}
                                                                                -{' '}
                                                                                {
                                                                                    item.tipoNome
                                                                                }{' '}
                                                                                /{' '}
                                                                                {
                                                                                    item.marcaNome
                                                                                }
                                                                                {' / '}
                                                                                {
                                                                                    item.modeloNome
                                                                                }
                                                                            </p>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                Qtd:{' '}
                                                                                {item.quantidade.toLocaleString(
                                                                                    'pt-BR',
                                                                                    {
                                                                                        maximumFractionDigits: 4,
                                                                                    },
                                                                                )}{' '}
                                                                                x
                                                                                Unit:{' '}
                                                                                {formatBrl(
                                                                                    item.valorUnitario,
                                                                                )}{' '}
                                                                                ={' '}
                                                                                {formatBrl(
                                                                                    item.total,
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <p className="text-sm font-medium">
                                                                Resumo da
                                                                entrada
                                                            </p>
                                                            <div className="space-y-4">
                                                                {
                                                                    resumoEntradaBlocos
                                                                }
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-auto flex flex-wrap justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={processing}
                                        onClick={() => setShowSairDialog(true)}
                                    >
                                        Descartar
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing
                                            ? 'Enviando…'
                                            : 'Registrar entrada'}
                                    </Button>
                                </div>
                            </div>

                            <div className="flex h-full min-h-0 flex-col gap-4">
                                <Card className="min-h-0 flex-1 overflow-hidden border-primary/20 bg-muted/30 shadow-sm">
                                    <CardHeader className="border-b bg-muted/30">
                                        <CardTitle className="text-base">
                                            Resumo da entrada
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="mt-2 space-y-4 overflow-y-auto text-sm [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/70 [&::-webkit-scrollbar-track]:bg-transparent">
                                        {resumoEntradaBlocos}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    ) : (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Condição da entrada</CardTitle>
                                    <CardDescription>
                                        Define se a mercadoria é nova ou usada e
                                        se há nota fiscal.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Label htmlFor="condicao_entrada">
                                        Tipo de entrada *
                                    </Label>
                                    <Select
                                        value={selectVal(condicaoEntrada)}
                                        onValueChange={(v) =>
                                            setCondicaoEntrada(
                                                v === SELECT_VAZIO ? '' : v,
                                            )
                                        }
                                    >
                                        <SelectTrigger
                                            id="condicao_entrada"
                                            className="w-full"
                                        >
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent position="popper">
                                            <SelectItem
                                                value={SELECT_VAZIO}
                                                disabled
                                            >
                                                Selecione
                                            </SelectItem>
                                            {condicoesEntrada.map((c) => (
                                                <SelectItem
                                                    key={c.value}
                                                    value={c.value}
                                                >
                                                    {c.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.condicao_entrada && (
                                        <p className="text-xs text-destructive">
                                            {errors.condicao_entrada}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            {mostrarNota && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            Dados da nota fiscal
                                        </CardTitle>
                                        <CardDescription>
                                            Campos exibidos quando a condição
                                            exige nota fiscal.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label htmlFor="nota_numero">
                                                Número da nota *
                                            </Label>
                                            <Input
                                                id="nota_numero"
                                                value={notaNumero}
                                                onChange={(e) =>
                                                    setNotaNumero(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            {errors.nota_numero && (
                                                <p className="text-xs text-destructive">
                                                    {errors.nota_numero}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="nota_data_emissao">
                                                Data de emissão
                                            </Label>
                                            <Input
                                                id="nota_data_emissao"
                                                type="date"
                                                value={notaDataEmissao}
                                                onChange={(e) =>
                                                    setNotaDataEmissao(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            {errors.nota_data_emissao && (
                                                <p className="text-xs text-destructive">
                                                    {errors.nota_data_emissao}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="nota_fornecedor">
                                                Fornecedor
                                            </Label>
                                            <Select
                                                value={selectVal(
                                                    notaFornecedorId,
                                                )}
                                                onValueChange={(v) =>
                                                    setNotaFornecedorId(
                                                        v === SELECT_VAZIO
                                                            ? ''
                                                            : v,
                                                    )
                                                }
                                            >
                                                <SelectTrigger
                                                    id="nota_fornecedor"
                                                    className="w-full"
                                                >
                                                    <SelectValue placeholder="Opcional" />
                                                </SelectTrigger>
                                                <SelectContent position="popper">
                                                    <SelectItem
                                                        value={SELECT_VAZIO}
                                                    >
                                                        Nenhum
                                                    </SelectItem>
                                                    {fornecedores.map((f) => (
                                                        <SelectItem
                                                            key={f.id}
                                                            value={String(f.id)}
                                                        >
                                                            {f.nome_fantasia ||
                                                                f.nome}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label htmlFor="nota_arquivo">
                                                Arquivo da nota fiscal
                                            </Label>
                                            <Input
                                                id="nota_arquivo"
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png,.webp"
                                                onChange={(e) =>
                                                    setNotaArquivo(
                                                        e.target.files?.[0] ??
                                                            null,
                                                    )
                                                }
                                            />
                                            {errors.nota_arquivo && (
                                                <p className="text-xs text-destructive">
                                                    {errors.nota_arquivo}
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <Card>
                                <CardHeader>
                                    <CardTitle>Dados da movimentação</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="estoque_id">
                                            Estoque de destino *
                                        </Label>
                                        <Select
                                            value={selectVal(estoqueId)}
                                            onValueChange={(v) =>
                                                setEstoqueId(
                                                    v === SELECT_VAZIO ? '' : v,
                                                )
                                            }
                                        >
                                            <SelectTrigger
                                                id="estoque_id"
                                                className="w-full"
                                            >
                                                <SelectValue placeholder="Selecione o estoque" />
                                            </SelectTrigger>
                                            <SelectContent position="popper">
                                                <SelectItem
                                                    value={SELECT_VAZIO}
                                                    disabled
                                                >
                                                    Selecione
                                                </SelectItem>
                                                {estoques.map((e) => (
                                                    <SelectItem
                                                        key={e.id}
                                                        value={String(e.id)}
                                                    >
                                                        {e.nome}
                                                        {e.empresa
                                                            ? ` — ${e.empresa.nome}`
                                                            : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.estoque_id && (
                                            <p className="text-xs text-destructive">
                                                {errors.estoque_id}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="observacao">
                                            Observações gerais
                                        </Label>
                                        <textarea
                                            id="observacao"
                                            rows={3}
                                            value={observacao}
                                            onChange={(e) =>
                                                setObservacao(e.target.value)
                                            }
                                            className={cn(
                                                'flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs',
                                                'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                                'outline-none disabled:cursor-not-allowed disabled:opacity-50',
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
                                    <div>
                                        <CardTitle>Itens da entrada</CardTitle>
                                        <CardDescription>
                                            Tipo de material, marca,
                                            empresa/local do item, quantidades e
                                            anexos opcionais.
                                        </CardDescription>
                                    </div>
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
                                <CardContent className="space-y-6">
                                    {errors.itens && (
                                        <p className="text-sm text-destructive">
                                            {errors.itens}
                                        </p>
                                    )}
                                    {itens.map((item, index) => (
                                        <div
                                            key={index}
                                            id={`item-entrada-${index}`}
                                            className="space-y-4 rounded-lg border border-border p-4"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-sm font-medium">
                                                    Item {index + 1}
                                                </span>
                                                {itens.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive"
                                                        onClick={() =>
                                                            setItens((rows) =>
                                                                rows.filter(
                                                                    (_, i) =>
                                                                        i !==
                                                                        index,
                                                                ),
                                                            )
                                                        }
                                                        aria-label={`Remover item ${index + 1}`}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label>
                                                        Tipo de material *
                                                    </Label>
                                                    <Select
                                                        value={selectVal(
                                                            item.tipo_material_id,
                                                        )}
                                                        onValueChange={(v) => {
                                                            const next =
                                                                v ===
                                                                SELECT_VAZIO
                                                                    ? ''
                                                                    : v;
                                                            atualizarItem(
                                                                index,
                                                                {
                                                                    tipo_material_id:
                                                                        next,
                                                                    marca_id:
                                                                        '',
                                                                    modelo_marca_id:
                                                                        '',
                                                                    numero_serie:
                                                                        '',
                                                                    quantidade:
                                                                        tipoMaterialRastreavel(
                                                                            next,
                                                                        )
                                                                            ? '1'
                                                                            : '',
                                                                },
                                                            );
                                                        }}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Selecione" />
                                                        </SelectTrigger>
                                                        <SelectContent position="popper">
                                                            <SelectItem
                                                                value={
                                                                    SELECT_VAZIO
                                                                }
                                                                disabled
                                                            >
                                                                Selecione
                                                            </SelectItem>
                                                            {tiposMateriais.map(
                                                                (t) => (
                                                                    <SelectItem
                                                                        key={
                                                                            t.id
                                                                        }
                                                                        value={String(
                                                                            t.id,
                                                                        )}
                                                                    >
                                                                        {t.nome}
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    {errors[
                                                        `itens.${index}.tipo_material_id`
                                                    ] && (
                                                        <p className="text-xs text-destructive">
                                                            {
                                                                errors[
                                                                    `itens.${index}.tipo_material_id`
                                                                ]
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Marca *</Label>
                                                    <Select
                                                        value={selectVal(
                                                            item.marca_id,
                                                        )}
                                                        onValueChange={(v) =>
                                                            atualizarItem(
                                                                index,
                                                                {
                                                                    marca_id:
                                                                        v ===
                                                                        SELECT_VAZIO
                                                                            ? ''
                                                                            : v,
                                                                    modelo_marca_id:
                                                                        '',
                                                                },
                                                            )
                                                        }
                                                        disabled={
                                                            item.tipo_material_id ===
                                                            ''
                                                        }
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue
                                                                placeholder={
                                                                    item.tipo_material_id ===
                                                                    ''
                                                                        ? 'Selecione o tipo primeiro'
                                                                        : 'Selecione a marca'
                                                                }
                                                            />
                                                        </SelectTrigger>
                                                        <SelectContent position="popper">
                                                            <SelectItem
                                                                value={
                                                                    SELECT_VAZIO
                                                                }
                                                                disabled
                                                            >
                                                                Selecione
                                                            </SelectItem>
                                                            {marcasPorTipo(
                                                                item.tipo_material_id,
                                                            ).map((m) => (
                                                                <SelectItem
                                                                    key={m.id}
                                                                    value={String(
                                                                        m.id,
                                                                    )}
                                                                >
                                                                    {m.nome}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {errors[
                                                        `itens.${index}.marca_id`
                                                    ] && (
                                                        <p className="text-xs text-destructive">
                                                            {
                                                                errors[
                                                                    `itens.${index}.marca_id`
                                                                ]
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Modelo *</Label>
                                                    <Select
                                                        value={selectVal(
                                                            item.modelo_marca_id,
                                                        )}
                                                        onValueChange={(v) =>
                                                            atualizarItem(
                                                                index,
                                                                {
                                                                    modelo_marca_id:
                                                                        v ===
                                                                        SELECT_VAZIO
                                                                            ? ''
                                                                            : v,
                                                                },
                                                            )
                                                        }
                                                        disabled={
                                                            item.marca_id ===
                                                            ''
                                                        }
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue
                                                                placeholder={
                                                                    item.marca_id ===
                                                                    ''
                                                                        ? 'Selecione a marca primeiro'
                                                                        : 'Selecione o modelo'
                                                                }
                                                            />
                                                        </SelectTrigger>
                                                        <SelectContent position="popper">
                                                            <SelectItem
                                                                value={
                                                                    SELECT_VAZIO
                                                                }
                                                                disabled
                                                            >
                                                                Selecione
                                                            </SelectItem>
                                                            {modelosPorMarca(
                                                                item.marca_id,
                                                            ).map((modelo) => (
                                                                <SelectItem
                                                                    key={
                                                                        modelo.id
                                                                    }
                                                                    value={String(
                                                                        modelo.id,
                                                                    )}
                                                                >
                                                                    {modelo.nome}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {errors[
                                                        `itens.${index}.modelo_marca_id`
                                                    ] && (
                                                        <p className="text-xs text-destructive">
                                                            {
                                                                errors[
                                                                    `itens.${index}.modelo_marca_id`
                                                                ]
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Empresa</Label>
                                                    <Select
                                                        value={selectVal(
                                                            item.empresa_id,
                                                        )}
                                                        onValueChange={(v) => {
                                                            const next =
                                                                v ===
                                                                SELECT_VAZIO
                                                                    ? ''
                                                                    : v;
                                                            atualizarItem(
                                                                index,
                                                                {
                                                                    empresa_id:
                                                                        next,
                                                                    local_id:
                                                                        '',
                                                                },
                                                            );
                                                        }}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Opcional" />
                                                        </SelectTrigger>
                                                        <SelectContent position="popper">
                                                            <SelectItem
                                                                value={
                                                                    SELECT_VAZIO
                                                                }
                                                            >
                                                                Nenhuma
                                                            </SelectItem>
                                                            {empresas.map(
                                                                (e) => (
                                                                    <SelectItem
                                                                        key={
                                                                            e.id
                                                                        }
                                                                        value={String(
                                                                            e.id,
                                                                        )}
                                                                    >
                                                                        {e.nome}
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
                                                            item.local_id,
                                                        )}
                                                        onValueChange={(v) =>
                                                            atualizarItem(
                                                                index,
                                                                {
                                                                    local_id:
                                                                        v ===
                                                                        SELECT_VAZIO
                                                                            ? ''
                                                                            : v,
                                                                },
                                                            )
                                                        }
                                                        disabled={
                                                            item.empresa_id ===
                                                            ''
                                                        }
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue
                                                                placeholder={
                                                                    item.empresa_id ===
                                                                    ''
                                                                        ? 'Selecione empresa'
                                                                        : 'Opcional'
                                                                }
                                                            />
                                                        </SelectTrigger>
                                                        <SelectContent position="popper">
                                                            <SelectItem
                                                                value={
                                                                    SELECT_VAZIO
                                                                }
                                                            >
                                                                Nenhum
                                                            </SelectItem>
                                                            {locaisPorEmpresa(
                                                                item.empresa_id,
                                                            ).map((l) => (
                                                                <SelectItem
                                                                    key={l.id}
                                                                    value={String(
                                                                        l.id,
                                                                    )}
                                                                >
                                                                    {l.nome} (
                                                                    {l.codigo})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {errors[
                                                        `itens.${index}.local_id`
                                                    ] && (
                                                        <p className="text-xs text-destructive">
                                                            {
                                                                errors[
                                                                    `itens.${index}.local_id`
                                                                ]
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                                {item.tipo_material_id !== '' &&
                                                    tipoMaterialRastreavel(
                                                        item.tipo_material_id,
                                                    ) && (
                                                        <div className="space-y-2">
                                                            <Label>
                                                                Número de série
                                                                *
                                                            </Label>
                                                            <Input
                                                                value={
                                                                    item.numero_serie
                                                                }
                                                                onChange={(e) =>
                                                                    atualizarItem(
                                                                        index,
                                                                        {
                                                                            numero_serie:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        },
                                                                    )
                                                                }
                                                                placeholder="Informe o número de série"
                                                            />
                                                            {errors[
                                                                `itens.${index}.numero_serie`
                                                            ] && (
                                                                <p className="text-xs text-destructive">
                                                                    {
                                                                        errors[
                                                                            `itens.${index}.numero_serie`
                                                                        ]
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                <div className="space-y-2">
                                                    <Label>Quantidade *</Label>
                                                    <Input
                                                        inputMode="decimal"
                                                        value={item.quantidade}
                                                        disabled={tipoMaterialRastreavel(
                                                            item.tipo_material_id,
                                                        )}
                                                        onChange={(e) =>
                                                            atualizarItem(
                                                                index,
                                                                {
                                                                    quantidade:
                                                                        e.target
                                                                            .value,
                                                                },
                                                            )
                                                        }
                                                    />
                                                    {tipoMaterialRastreavel(
                                                        item.tipo_material_id,
                                                    ) && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Materiais rastreáveis sempre registram quantidade fixa igual a 1.
                                                        </p>
                                                    )}
                                                    {errors[
                                                        `itens.${index}.quantidade`
                                                    ] && (
                                                        <p className="text-xs text-destructive">
                                                            {
                                                                errors[
                                                                    `itens.${index}.quantidade`
                                                                ]
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>
                                                        Valor unitário *
                                                    </Label>
                                                    <Input
                                                        inputMode="decimal"
                                                        value={
                                                            item.valor_unitario
                                                        }
                                                        onChange={(e) =>
                                                            atualizarItem(
                                                                index,
                                                                {
                                                                    valor_unitario:
                                                                        e.target
                                                                            .value,
                                                                },
                                                            )
                                                        }
                                                    />
                                                    {errors[
                                                        `itens.${index}.valor_unitario`
                                                    ] && (
                                                        <p className="text-xs text-destructive">
                                                            {
                                                                errors[
                                                                    `itens.${index}.valor_unitario`
                                                                ]
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="space-y-2 sm:col-span-2">
                                                    <Label>
                                                        Observação do item
                                                    </Label>
                                                    <Input
                                                        value={item.observacao}
                                                        onChange={(e) =>
                                                            atualizarItem(
                                                                index,
                                                                {
                                                                    observacao:
                                                                        e.target
                                                                            .value,
                                                                },
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>
                                                        Termo de recebimento
                                                    </Label>
                                                    <Input
                                                        type="file"
                                                        onChange={(e) =>
                                                            atualizarItem(
                                                                index,
                                                                {
                                                                    termo:
                                                                        e.target
                                                                            .files?.[0] ??
                                                                        null,
                                                                },
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Fotos</Label>
                                                    <Input
                                                        type="file"
                                                        multiple
                                                        accept="image/*"
                                                        onChange={(e) =>
                                                            atualizarItem(
                                                                index,
                                                                {
                                                                    fotos: e
                                                                        .target
                                                                        .files
                                                                        ? Array.from(
                                                                              e
                                                                                  .target
                                                                                  .files,
                                                                          )
                                                                        : [],
                                                                },
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex justify-end">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={adicionarItemComScroll}
                                        >
                                            <Plus className="mr-1 h-4 w-4" />
                                            Adicionar item
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Total do lote</CardTitle>
                                    <CardDescription>
                                        Soma automática dos itens.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm">
                                    <div className="flex flex-wrap gap-8">
                                        <div>
                                            <p className="text-muted-foreground">
                                                Quantidade total
                                            </p>
                                            <p className="text-lg font-semibold">
                                                {totalLote.quantidade.toLocaleString(
                                                    'pt-BR',
                                                    {
                                                        maximumFractionDigits: 4,
                                                    },
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">
                                                Valor total
                                            </p>
                                            <p className="text-lg font-semibold">
                                                {formatBrl(totalLote.valor)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">
                                            Total por item
                                        </p>
                                        <div className="space-y-2">
                                            {totaisPorItem.map((item) => (
                                                <div
                                                    key={item.index}
                                                    className="rounded-md border border-border/60 bg-muted/20 px-3 py-2"
                                                >
                                                    <p className="text-sm font-medium">
                                                        Item {item.index + 1} -{' '}
                                                        {item.tipoNome} /{' '}
                                                        {item.marcaNome} /{' '}
                                                        {item.modeloNome}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Qtd:{' '}
                                                        {item.quantidade.toLocaleString(
                                                            'pt-BR',
                                                            {
                                                                maximumFractionDigits: 4,
                                                            },
                                                        )}{' '}
                                                        x Unit:{' '}
                                                        {formatBrl(
                                                            item.valorUnitario,
                                                        )}{' '}
                                                        ={' '}
                                                        {formatBrl(item.total)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-sm font-medium">
                                            Resumo da entrada
                                        </p>
                                        <div className="space-y-4">
                                            {resumoEntradaBlocos}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex flex-wrap justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={processing}
                                    onClick={() => setShowSairDialog(true)}
                                >
                                    Descartar
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? 'Enviando…'
                                        : 'Registrar entrada'}
                                </Button>
                            </div>
                        </>
                    )}
                </form>
            </div>

            <AlertDialog open={showSairDialog} onOpenChange={setShowSairDialog}>
                <AlertDialogContent className="w-full">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sair sem registrar?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Os dados preenchidos serão perdidos. Esta ação não
                            pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            Voltar ao formulário
                        </AlertDialogCancel>
                        {embedded ? (
                            <Button
                                type="button"
                                variant="default"
                                onClick={() => {
                                    setShowSairDialog(false);
                                    onRequestClose?.();
                                }}
                            >
                                Fechar modal
                            </Button>
                        ) : (
                            <Button asChild variant="default">
                                <Link href={BASE}>Sair para a lista</Link>
                            </Button>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
