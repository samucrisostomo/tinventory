import { Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Columns2, GalleryVerticalEnd } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import NovaEntradaLote, { type NovaEntradaLoteProps } from './nova';

const BASE = '/operacoes-estoque/entradas-lote';
const ENTRY_VIEW_MODE_STORAGE_KEY = 'entradas-lote:view-mode';

type EntradaRow = {
    id: number;
    condicao_entrada: string;
    total_quantidade: string;
    total_valor: string;
    created_at: string;
    estoque: { id: number; nome: string } | null;
    user: { id: number; name: string } | null;
};

type Props = {
    estatisticas: {
        entradas_no_mes: number;
        quantidade_total_mes: number;
        valor_total_mes: number;
    };
    entradasRecentes: EntradaRow[];
} & NovaEntradaLoteProps;

const labelCondicao = (value: string, opcoes: CondicaoOption[]) =>
    opcoes.find((o) => o.value === value)?.label ?? value;

const formatBrl = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function EntradasLoteIndex({
    estatisticas,
    entradasRecentes,
    condicoesEntrada,
    tiposMateriais,
    marcas,
    modelosMarcas,
    estoques,
    fornecedores,
    empresas,
    locais,
}: Props) {
    const { flash } = usePage().props as {
        flash?: { success?: string; error?: string };
    };
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [entryViewMode, setEntryViewMode] = useState<'carousel' | 'normal'>('carousel');

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash?.success, flash?.error]);

    useEffect(() => {
        const savedMode = window.localStorage.getItem(ENTRY_VIEW_MODE_STORAGE_KEY);

        if (savedMode === 'carousel' || savedMode === 'normal') {
            setEntryViewMode(savedMode);
        }
    }, []);

    useEffect(() => {
        window.localStorage.setItem(ENTRY_VIEW_MODE_STORAGE_KEY, entryViewMode);
    }, [entryViewMode]);

    return (
        <>
            <Head title="Entradas em lote" />

            <div className="space-y-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-lg font-semibold">
                            Entradas em lote
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Registre entradas com vários itens, nota fiscal
                            quando aplicável e anexos por item.
                        </p>
                    </div>
                    <Button
                        type="button"
                        onClick={() => setCreateDialogOpen(true)}
                    >
                        Nova entrada
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Entradas no mês
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">
                                {estatisticas.entradas_no_mes}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Quantidade (mês)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">
                                {estatisticas.quantidade_total_mes.toLocaleString(
                                    'pt-BR',
                                    {
                                        maximumFractionDigits: 4,
                                    },
                                )}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Valor total (mês)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">
                                {formatBrl(estatisticas.valor_total_mes)}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Entradas recentes</CardTitle>
                        <CardDescription>
                            Últimas movimentações registradas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto p-0">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        Data
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Estoque
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Condição
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Qtd
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Valor
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Usuário
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {entradasRecentes.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-8 text-center text-muted-foreground"
                                        >
                                            Nenhuma entrada registrada ainda.
                                        </td>
                                    </tr>
                                ) : (
                                    entradasRecentes.map((e) => (
                                        <tr
                                            key={e.id}
                                            className="border-t border-border"
                                        >
                                            <td className="px-4 py-3">
                                                {new Date(
                                                    e.created_at,
                                                ).toLocaleString('pt-BR')}
                                            </td>
                                            <td className="px-4 py-3">
                                                {e.estoque?.nome ?? '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {labelCondicao(
                                                    e.condicao_entrada,
                                                    condicoesEntrada,
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {Number(
                                                    e.total_quantidade,
                                                ).toLocaleString('pt-BR', {
                                                    maximumFractionDigits: 4,
                                                })}
                                            </td>
                                            <td className="px-4 py-3">
                                                {formatBrl(
                                                    Number(e.total_valor),
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {e.user?.name ?? '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="grid h-[97vh] max-h-[97vh] w-[calc(100vw-1.5rem)] max-w-none grid-rows-[auto_minmax(0,1fr)] overflow-hidden sm:w-[calc(100vw-4rem)] sm:max-w-none lg:w-[calc(100vw-8rem)]">
                    <DialogHeader>
                        <DialogTitle>Nova entrada em lote</DialogTitle>
                        <div className="flex items-center justify-between gap-3">
                            <DialogDescription>
                                Cadastre uma nova entrada sem sair da tela de
                                listagem.
                            </DialogDescription>
                            <div className="inline-flex items-center gap-1 rounded-md border border-input p-1">
                                <Button
                                    type="button"
                                    variant={entryViewMode === 'carousel' ? 'default' : 'ghost'}
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={() => setEntryViewMode('carousel')}
                                    aria-label="Modo A: carousel"
                                    title="Modo A: carousel"
                                >
                                    <Columns2 className="h-4 w-4" />A
                                </Button>
                                <Button
                                    type="button"
                                    variant={entryViewMode === 'normal' ? 'default' : 'ghost'}
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={() => setEntryViewMode('normal')}
                                    aria-label="Modo B: normal"
                                    title="Modo B: normal"
                                >
                                    <GalleryVerticalEnd className="h-4 w-4" />B
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="min-h-0 overflow-hidden">
                        <NovaEntradaLote
                            tiposMateriais={tiposMateriais}
                            marcas={marcas}
                            modelosMarcas={modelosMarcas}
                            estoques={estoques}
                            fornecedores={fornecedores}
                            empresas={empresas}
                            locais={locais}
                            condicoesEntrada={condicoesEntrada}
                            embedded
                            viewMode={entryViewMode}
                            onRequestClose={() => setCreateDialogOpen(false)}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

