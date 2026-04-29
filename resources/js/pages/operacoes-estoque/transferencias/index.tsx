import { Head } from '@inertiajs/react';
import { ClipboardList, Plus, Repeat, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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
    numero_serie: string;
    local: string;
    empresa: string;
    condicao: string;
    quantidade: string;
};

type Props = {
    estoques: EstoqueOption[];
    materiaisPorEstoque: Record<string, MaterialOption[]>;
};

const novoItem = (): ItemTransferencia => ({
    material_id: '',
    numero_serie: '',
    local: '',
    empresa: '',
    condicao: '',
    quantidade: '',
});

const selectVal = (value: string) => (value === '' ? SELECT_VAZIO : value);

export default function TransferenciasEstoquePage({
    estoques,
    materiaisPorEstoque,
}: Props) {
    const [modalAberto, setModalAberto] = useState(false);
    const [estoqueOrigemId, setEstoqueOrigemId] = useState('');
    const [estoqueDestinoId, setEstoqueDestinoId] = useState('');
    const [itens, setItens] = useState<ItemTransferencia[]>([novoItem()]);

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

    const atualizarItem = (index: number, patch: Partial<ItemTransferencia>) => {
        setItens((current) =>
            current.map((item, itemIndex) =>
                itemIndex === index ? { ...item, ...patch } : item,
            ),
        );
    };

    const trocarOrigem = (value: string) => {
        const origemId = value === SELECT_VAZIO ? '' : value;

        setEstoqueOrigemId(origemId);
        setItens([novoItem()]);
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
                numero_serie: '',
                local: '',
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
            numero_serie: primeiroVinculo?.numero_serie ?? '',
            local: primeiroVinculo?.local_nome ?? '',
            empresa: primeiroVinculo?.empresa_nome ?? '',
            condicao: primeiroVinculo?.condicao ?? '',
            quantidade: '1',
        });
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

        toast.success('Transferência pronta para envio.');
    };

    return (
        <>
            <Head title="Transferências de estoque" />

            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-lg font-semibold">Transferências de estoque</h1>
                        <p className="text-sm text-muted-foreground">
                            Movimente itens entre estoques com resumo geral em tempo real.
                        </p>
                    </div>
                    <Button type="button" onClick={() => setModalAberto(true)}>
                        Nova transferência
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Transferências</CardTitle>
                        <CardDescription>
                            Clique em &quot;Nova transferência&quot; para iniciar uma movimentação.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-lg border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
                            Nenhuma transferência registrada nesta tela ainda.
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={modalAberto} onOpenChange={setModalAberto}>
                <DialogContent className="grid h-[97vh] max-h-[97vh] w-[calc(100vw-1.5rem)] max-w-none grid-rows-[auto_minmax(0,1fr)] overflow-hidden sm:w-[calc(100vw-4rem)] sm:max-w-none lg:w-[calc(100vw-8rem)]">
                    <DialogHeader>
                        <DialogTitle>Nova transferência</DialogTitle>
                        <DialogDescription>
                            Informe origem, destino e itens para montar a transferência.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={onSubmit} className="min-h-0 overflow-hidden">
                        <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_340px] gap-4 overflow-x-auto">
                            <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Origem e destino</CardTitle>
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
                                            onClick={() => setItens((current) => [...current, novoItem()])}
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
                                                                onValueChange={(value) =>
                                                                    atualizarItem(index, {
                                                                        numero_serie:
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
                                                            <Label>Local</Label>
                                                            <Select
                                                                value={selectVal(item.local)}
                                                                onValueChange={(value) =>
                                                                    atualizarItem(index, {
                                                                        local:
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
                                                            <Label>Empresa</Label>
                                                            <Select
                                                                value={selectVal(item.empresa)}
                                                                onValueChange={(value) =>
                                                                    atualizarItem(index, {
                                                                        empresa:
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
                            </div>

                            <Card className="h-fit md:sticky md:top-0">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <ClipboardList className="h-4 w-4" />
                                        Resumo geral
                                    </CardTitle>
                                    <CardDescription>
                                        Confira os dados antes de concluir a transferência.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
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
                                    <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-border/70 p-3">
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
                                    <div className="flex items-center justify-end gap-2 pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setModalAberto(false)}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button type="submit">
                                            <Repeat className="mr-2 h-4 w-4" />
                                            Confirmar transferência
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

