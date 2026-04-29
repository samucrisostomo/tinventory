import { Head, Link } from '@inertiajs/react';
import { FileText, Package, Search, ShieldCheck, Boxes } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { BreadcrumbItem } from '@/types';

const ESTOQUES_BASE = '/operacoes-estoque/estoques';
const SELECT_VAZIO = '__none__';

type Documento = {
    nome: string;
    url: string;
};

type MaterialRow = {
    id: number;
    material_id: number;
    codigo: string;
    descricao: string;
    condicao: string;
    quantidade: number;
    local: string;
    empresa: string;
    numero_serie: string;
    unidade: string;
    rastreavel: boolean;
    documentos: Documento[];
};

type Props = {
    estoque: {
        id: number;
        nome: string;
        tipo_estoque?: { id: number; codigo: string; descricao: string | null } | null;
        empresa?: { id: number; nome: string } | null;
        local?: { id: number; nome: string; codigo: string } | null;
    };
    indicadores: {
        total_materiais: number;
        total_itens: number;
        itens_rastreaveis: number;
    };
    filtros: {
        locais: string[];
        empresas: string[];
        condicoes: string[];
    };
    materiais: MaterialRow[];
};

const formatQuantidade = (value: number) =>
    value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 4 });

export default function EstoqueMateriaisPage({
    estoque,
    indicadores,
    filtros,
    materiais,
}: Props) {
    const [busca, setBusca] = useState('');
    const [numeroSerie, setNumeroSerie] = useState('');
    const [local, setLocal] = useState('');
    const [condicao, setCondicao] = useState('');
    const [empresa, setEmpresa] = useState('');
    const [docsAbertos, setDocsAbertos] = useState<Documento[] | null>(null);

    const materiaisFiltrados = useMemo(() => {
        const query = busca.trim().toLowerCase();
        const serie = numeroSerie.trim().toLowerCase();

        return materiais.filter((item) => {
            const matchBusca =
                query === '' ||
                item.codigo.toLowerCase().includes(query) ||
                item.descricao.toLowerCase().includes(query);
            const matchSerie =
                serie === '' || item.numero_serie.toLowerCase().includes(serie);
            const matchLocal = local === '' || item.local === local;
            const matchCondicao = condicao === '' || item.condicao === condicao;
            const matchEmpresa = empresa === '' || item.empresa === empresa;

            return (
                matchBusca && matchSerie && matchLocal && matchCondicao && matchEmpresa
            );
        });
    }, [busca, condicao, empresa, local, materiais, numeroSerie]);

    return (
        <>
            <Head title={`Materiais do Estoque - ${estoque.nome}`} />

            <div className="space-y-6 p-4">
                <div className="rounded-2xl border border-primary/20 bg-linear-to-r from-primary/10 via-background to-accent/20 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                                ESTOQUE ATUAL
                            </p>
                            <h1 className="text-xl font-semibold">Materiais do Estoque</h1>
                            <p className="text-sm text-muted-foreground">
                                {estoque.nome} • {estoque.empresa?.nome ?? '-'} •{' '}
                                {estoque.local
                                    ? `${estoque.local.nome} (${estoque.local.codigo})`
                                    : '-'}
                            </p>
                        </div>
                        <Button asChild variant="outline">
                            <Link href={ESTOQUES_BASE}>Voltar para Estoques</Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-primary/30 bg-linear-to-br from-primary/15 via-background to-primary/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <Boxes className="h-4 w-4 text-primary" />
                                Total de Materiais
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{indicadores.total_materiais}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-emerald-500/30 bg-linear-to-br from-emerald-500/15 via-background to-emerald-500/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <Package className="h-4 w-4 text-emerald-600" />
                                Total de Itens
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">
                                {formatQuantidade(indicadores.total_itens)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-indigo-500/30 bg-linear-to-br from-indigo-500/15 via-background to-indigo-500/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                                Itens Rastreáveis
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">
                                {formatQuantidade(indicadores.itens_rastreaveis)}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-border/70 bg-linear-to-r from-card via-card to-muted/30">
                    <CardHeader>
                        <CardTitle className="text-base">Filtros</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                        <div className="space-y-2 xl:col-span-2">
                            <Label>Buscar Material</Label>
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={busca}
                                    onChange={(event) => setBusca(event.target.value)}
                                    className="pl-9"
                                    placeholder="Código ou descrição"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Número de Série</Label>
                            <Input
                                value={numeroSerie}
                                onChange={(event) => setNumeroSerie(event.target.value)}
                                placeholder="Pesquisar série"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Local</Label>
                            <Select
                                value={local === '' ? SELECT_VAZIO : local}
                                onValueChange={(value) =>
                                    setLocal(value === SELECT_VAZIO ? '' : value)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={SELECT_VAZIO}>Todos</SelectItem>
                                    {filtros.locais.map((localOption) => (
                                        <SelectItem key={localOption} value={localOption}>
                                            {localOption}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Condição</Label>
                            <Select
                                value={condicao === '' ? SELECT_VAZIO : condicao}
                                onValueChange={(value) =>
                                    setCondicao(value === SELECT_VAZIO ? '' : value)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={SELECT_VAZIO}>Todas</SelectItem>
                                    {filtros.condicoes.map((condicaoOption) => (
                                        <SelectItem key={condicaoOption} value={condicaoOption}>
                                            {condicaoOption}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Empresa</Label>
                            <Select
                                value={empresa === '' ? SELECT_VAZIO : empresa}
                                onValueChange={(value) =>
                                    setEmpresa(value === SELECT_VAZIO ? '' : value)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={SELECT_VAZIO}>Todas</SelectItem>
                                    {filtros.empresas.map((empresaOption) => (
                                        <SelectItem key={empresaOption} value={empresaOption}>
                                            {empresaOption}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Lista de Materiais</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {materiaisFiltrados.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
                                Nenhum material encontrado com os filtros selecionados.
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-border/70">
                                <table className="w-full min-w-[1100px] text-sm">
                                    <thead className="bg-muted/40">
                                        <tr className="border-b border-border/70 text-left">
                                            <th className="px-3 py-2 font-medium">Código</th>
                                            <th className="px-3 py-2 font-medium">Descrição</th>
                                            <th className="px-3 py-2 font-medium">Condição</th>
                                            <th className="px-3 py-2 font-medium">Quantidade</th>
                                            <th className="px-3 py-2 font-medium">Local</th>
                                            <th className="px-3 py-2 font-medium">Empresa</th>
                                            <th className="px-3 py-2 font-medium">N° Série</th>
                                            <th className="px-3 py-2 font-medium">Unidade</th>
                                            <th className="px-3 py-2 font-medium text-center">
                                                Documentos
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {materiaisFiltrados.map((material) => (
                                            <tr
                                                key={material.id}
                                                className="border-b border-border/50 odd:bg-background even:bg-muted/10"
                                            >
                                                <td className="px-3 py-2 font-medium">
                                                    {material.codigo}
                                                </td>
                                                <td className="px-3 py-2">{material.descricao}</td>
                                                <td className="px-3 py-2">
                                                    <Badge variant="secondary">
                                                        {material.condicao}
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-2">
                                                    {formatQuantidade(material.quantidade)}
                                                </td>
                                                <td className="px-3 py-2">{material.local}</td>
                                                <td className="px-3 py-2">{material.empresa}</td>
                                                <td className="px-3 py-2">
                                                    {material.numero_serie}
                                                </td>
                                                <td className="px-3 py-2">{material.unidade}</td>
                                                <td className="px-3 py-2 text-center">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            setDocsAbertos(
                                                                material.documentos,
                                                            )
                                                        }
                                                        aria-label="Abrir documentos"
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={docsAbertos !== null} onOpenChange={() => setDocsAbertos(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Documentos do item</DialogTitle>
                        <DialogDescription>
                            Arquivos vinculados ao material selecionado.
                        </DialogDescription>
                    </DialogHeader>
                    {docsAbertos && docsAbertos.length > 0 ? (
                        <div className="space-y-2">
                            {docsAbertos.map((doc) => (
                                <a
                                    key={`${doc.nome}-${doc.url}`}
                                    href={doc.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm hover:bg-muted/40"
                                >
                                    <FileText className="h-4 w-4 text-primary" />
                                    <span>{doc.nome}</span>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Nenhum documento disponível para este item.
                        </p>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

EstoqueMateriaisPage.layout = {
    breadcrumbs: [
        { title: 'Operacoes', href: ESTOQUES_BASE },
        { title: 'Estoque', href: ESTOQUES_BASE },
        { title: 'Estoques', href: ESTOQUES_BASE },
        { title: 'Materiais do Estoque', href: ESTOQUES_BASE },
    ] satisfies BreadcrumbItem[],
};

