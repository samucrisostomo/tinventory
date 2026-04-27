import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { BreadcrumbItem } from '@/types';

const BASE = '/operacoes-estoque/entradas-lote';
const POST_URL = `${BASE}`;
const SELECT_VAZIO = '__none__';

type CondicaoOption = { value: string; label: string };

type Option = { id: number; nome: string };
type TipoMat = { id: number; nome: string; rastreavel: boolean };
type MarcaOpt = { id: number; nome: string; tipo_material_id: number };
type EstoqueOpt = {
    id: number;
    nome: string;
    empresa_id: number;
    local_id: number;
    empresa: { id: number; nome: string } | null;
    local: { id: number; nome: string; codigo: string } | null;
};
type LocalOpt = { id: number; nome: string; codigo: string; empresa_id: number };
type FornecedorOpt = { id: number; nome: string; nome_fantasia: string | null };

type ItemLinha = {
    tipo_material_id: string;
    marca_id: string;
    empresa_id: string;
    local_id: string;
    quantidade: string;
    valor_unitario: string;
    observacao: string;
    termo: File | null;
    fotos: File[];
};

type Props = {
    tiposMateriais: TipoMat[];
    marcas: MarcaOpt[];
    estoques: EstoqueOpt[];
    fornecedores: FornecedorOpt[];
    empresas: Option[];
    locais: LocalOpt[];
    condicoesEntrada: CondicaoOption[];
};

const novoItem = (): ItemLinha => ({
    tipo_material_id: '',
    marca_id: '',
    empresa_id: '',
    local_id: '',
    quantidade: '',
    valor_unitario: '',
    observacao: '',
    termo: null,
    fotos: [],
});

const exigeNotaFiscal = (condicao: string) => condicao.includes('com_nota_fiscal');

const selectVal = (v: string) => (v === '' ? SELECT_VAZIO : v);

const formatBrl = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function NovaEntradaLote({
    tiposMateriais,
    marcas,
    estoques,
    fornecedores,
    empresas,
    locais,
    condicoesEntrada,
}: Props) {
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

    const atualizarItem = (index: number, patch: Partial<ItemLinha>) => {
        setItens((rows) =>
            rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
        );
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
            fd.append(`itens[${i}][tipo_material_id]`, it.tipo_material_id);
            fd.append(`itens[${i}][marca_id]`, it.marca_id);
            if (it.empresa_id !== '') {
                fd.append(`itens[${i}][empresa_id]`, it.empresa_id);
            }
            if (it.local_id !== '') {
                fd.append(`itens[${i}][local_id]`, it.local_id);
            }
            fd.append(`itens[${i}][quantidade]`, it.quantidade.replace(',', '.'));
            fd.append(`itens[${i}][valor_unitario]`, it.valor_unitario.replace(',', '.'));
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
        setErrors({});
        setProcessing(true);

        router.post(POST_URL, montarFormData(), {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => setProcessing(false),
            onError: (errs) => setErrors(errs as Record<string, string>),
        });
    };

    const primeiroErroGeral = () => {
        const keys = Object.keys(errors).filter((k) => !k.startsWith('itens.'));
        return keys.length ? errors[keys[0]!] : null;
    };

    return (
        <>
            <Head title="Nova entrada em lote" />

            <div className="mx-auto max-w-5xl space-y-6 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
                            <Link href={BASE}>
                                <ArrowLeft className="mr-1 h-4 w-4" />
                                Voltar à lista
                            </Link>
                        </Button>
                        <h1 className="text-lg font-semibold">Nova entrada em lote</h1>
                        <p className="text-sm text-muted-foreground">
                            Preencha a condição da entrada, o estoque de destino e os itens. Use
                            cancelar para sair com confirmação se já houver dados.
                        </p>
                    </div>
                    <Button type="button" variant="outline" onClick={() => setShowSairDialog(true)}>
                        Cancelar entrada
                    </Button>
                </div>

                {primeiroErroGeral() && (
                    <div
                        className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                        role="alert"
                    >
                        {primeiroErroGeral()}
                    </div>
                )}

                <form className="space-y-6" onSubmit={enviar}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Condição da entrada</CardTitle>
                            <CardDescription>
                                Define se a mercadoria é nova ou usada e se há nota fiscal.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Label htmlFor="condicao_entrada">Tipo de entrada *</Label>
                            <Select
                                value={selectVal(condicaoEntrada)}
                                onValueChange={(v) =>
                                    setCondicaoEntrada(v === SELECT_VAZIO ? '' : v)
                                }
                            >
                                <SelectTrigger id="condicao_entrada" className="max-w-xl">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                    <SelectItem value={SELECT_VAZIO} disabled>
                                        Selecione
                                    </SelectItem>
                                    {condicoesEntrada.map((c) => (
                                        <SelectItem key={c.value} value={c.value}>
                                            {c.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.condicao_entrada && (
                                <p className="text-xs text-destructive">{errors.condicao_entrada}</p>
                            )}
                        </CardContent>
                    </Card>

                    {mostrarNota && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Dados da nota fiscal</CardTitle>
                                <CardDescription>
                                    Campos exibidos quando a condição exige nota fiscal.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="nota_numero">Número da nota *</Label>
                                    <Input
                                        id="nota_numero"
                                        value={notaNumero}
                                        onChange={(e) => setNotaNumero(e.target.value)}
                                    />
                                    {errors.nota_numero && (
                                        <p className="text-xs text-destructive">{errors.nota_numero}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="nota_data_emissao">Data de emissão</Label>
                                    <Input
                                        id="nota_data_emissao"
                                        type="date"
                                        value={notaDataEmissao}
                                        onChange={(e) => setNotaDataEmissao(e.target.value)}
                                    />
                                    {errors.nota_data_emissao && (
                                        <p className="text-xs text-destructive">
                                            {errors.nota_data_emissao}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="nota_fornecedor">Fornecedor</Label>
                                    <Select
                                        value={selectVal(notaFornecedorId)}
                                        onValueChange={(v) =>
                                            setNotaFornecedorId(v === SELECT_VAZIO ? '' : v)
                                        }
                                    >
                                        <SelectTrigger id="nota_fornecedor">
                                            <SelectValue placeholder="Opcional" />
                                        </SelectTrigger>
                                        <SelectContent position="popper">
                                            <SelectItem value={SELECT_VAZIO}>Nenhum</SelectItem>
                                            {fornecedores.map((f) => (
                                                <SelectItem key={f.id} value={String(f.id)}>
                                                    {f.nome_fantasia || f.nome}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="nota_arquivo">Arquivo da nota fiscal</Label>
                                    <Input
                                        id="nota_arquivo"
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                                        onChange={(e) =>
                                            setNotaArquivo(e.target.files?.[0] ?? null)
                                        }
                                    />
                                    {errors.nota_arquivo && (
                                        <p className="text-xs text-destructive">{errors.nota_arquivo}</p>
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
                                <Label htmlFor="estoque_id">Estoque de destino *</Label>
                                <Select
                                    value={selectVal(estoqueId)}
                                    onValueChange={(v) => setEstoqueId(v === SELECT_VAZIO ? '' : v)}
                                >
                                    <SelectTrigger id="estoque_id" className="max-w-xl">
                                        <SelectValue placeholder="Selecione o estoque" />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                        <SelectItem value={SELECT_VAZIO} disabled>
                                            Selecione
                                        </SelectItem>
                                        {estoques.map((e) => (
                                            <SelectItem key={e.id} value={String(e.id)}>
                                                {e.nome}
                                                {e.empresa ? ` — ${e.empresa.nome}` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.estoque_id && (
                                    <p className="text-xs text-destructive">{errors.estoque_id}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="observacao">Observações gerais</Label>
                                <textarea
                                    id="observacao"
                                    rows={3}
                                    value={observacao}
                                    onChange={(e) => setObservacao(e.target.value)}
                                    className={cn(
                                        'flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs',
                                        'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
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
                                    Tipo de material, marca, empresa/local do item, quantidades e
                                    anexos opcionais.
                                </CardDescription>
                            </div>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setItens((rows) => [...rows, novoItem()])}
                            >
                                <Plus className="mr-1 h-4 w-4" />
                                Adicionar item
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {errors.itens && (
                                <p className="text-sm text-destructive">{errors.itens}</p>
                            )}
                            {itens.map((item, index) => (
                                <div
                                    key={index}
                                    className="rounded-lg border border-border p-4 space-y-4"
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
                                                        rows.filter((_, i) => i !== index),
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
                                            <Label>Tipo de material *</Label>
                                            <Select
                                                value={selectVal(item.tipo_material_id)}
                                                onValueChange={(v) => {
                                                    const next = v === SELECT_VAZIO ? '' : v;
                                                    atualizarItem(index, {
                                                        tipo_material_id: next,
                                                        marca_id: '',
                                                    });
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                                <SelectContent position="popper">
                                                    <SelectItem value={SELECT_VAZIO} disabled>
                                                        Selecione
                                                    </SelectItem>
                                                    {tiposMateriais.map((t) => (
                                                        <SelectItem key={t.id} value={String(t.id)}>
                                                            {t.nome}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors[`itens.${index}.tipo_material_id`] && (
                                                <p className="text-xs text-destructive">
                                                    {errors[`itens.${index}.tipo_material_id`]}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Marca / modelo *</Label>
                                            <Select
                                                value={selectVal(item.marca_id)}
                                                onValueChange={(v) =>
                                                    atualizarItem(index, {
                                                        marca_id: v === SELECT_VAZIO ? '' : v,
                                                    })
                                                }
                                                disabled={item.tipo_material_id === ''}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue
                                                        placeholder={
                                                            item.tipo_material_id === ''
                                                                ? 'Selecione o tipo primeiro'
                                                                : 'Selecione a marca'
                                                        }
                                                    />
                                                </SelectTrigger>
                                                <SelectContent position="popper">
                                                    <SelectItem value={SELECT_VAZIO} disabled>
                                                        Selecione
                                                    </SelectItem>
                                                    {marcasPorTipo(item.tipo_material_id).map(
                                                        (m) => (
                                                            <SelectItem
                                                                key={m.id}
                                                                value={String(m.id)}
                                                            >
                                                                {m.nome}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {errors[`itens.${index}.marca_id`] && (
                                                <p className="text-xs text-destructive">
                                                    {errors[`itens.${index}.marca_id`]}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Empresa</Label>
                                            <Select
                                                value={selectVal(item.empresa_id)}
                                                onValueChange={(v) => {
                                                    const next = v === SELECT_VAZIO ? '' : v;
                                                    atualizarItem(index, {
                                                        empresa_id: next,
                                                        local_id: '',
                                                    });
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Opcional" />
                                                </SelectTrigger>
                                                <SelectContent position="popper">
                                                    <SelectItem value={SELECT_VAZIO}>Nenhuma</SelectItem>
                                                    {empresas.map((e) => (
                                                        <SelectItem key={e.id} value={String(e.id)}>
                                                            {e.nome}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Local</Label>
                                            <Select
                                                value={selectVal(item.local_id)}
                                                onValueChange={(v) =>
                                                    atualizarItem(index, {
                                                        local_id: v === SELECT_VAZIO ? '' : v,
                                                    })
                                                }
                                                disabled={item.empresa_id === ''}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue
                                                        placeholder={
                                                            item.empresa_id === ''
                                                                ? 'Selecione empresa'
                                                                : 'Opcional'
                                                        }
                                                    />
                                                </SelectTrigger>
                                                <SelectContent position="popper">
                                                    <SelectItem value={SELECT_VAZIO}>Nenhum</SelectItem>
                                                    {locaisPorEmpresa(item.empresa_id).map((l) => (
                                                        <SelectItem key={l.id} value={String(l.id)}>
                                                            {l.nome} ({l.codigo})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors[`itens.${index}.local_id`] && (
                                                <p className="text-xs text-destructive">
                                                    {errors[`itens.${index}.local_id`]}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Quantidade *</Label>
                                            <Input
                                                inputMode="decimal"
                                                value={item.quantidade}
                                                onChange={(e) =>
                                                    atualizarItem(index, {
                                                        quantidade: e.target.value,
                                                    })
                                                }
                                            />
                                            {errors[`itens.${index}.quantidade`] && (
                                                <p className="text-xs text-destructive">
                                                    {errors[`itens.${index}.quantidade`]}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Valor unitário *</Label>
                                            <Input
                                                inputMode="decimal"
                                                value={item.valor_unitario}
                                                onChange={(e) =>
                                                    atualizarItem(index, {
                                                        valor_unitario: e.target.value,
                                                    })
                                                }
                                            />
                                            {errors[`itens.${index}.valor_unitario`] && (
                                                <p className="text-xs text-destructive">
                                                    {errors[`itens.${index}.valor_unitario`]}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label>Observação do item</Label>
                                            <Input
                                                value={item.observacao}
                                                onChange={(e) =>
                                                    atualizarItem(index, {
                                                        observacao: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Termo de recebimento</Label>
                                            <Input
                                                type="file"
                                                onChange={(e) =>
                                                    atualizarItem(index, {
                                                        termo: e.target.files?.[0] ?? null,
                                                    })
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
                                                    atualizarItem(index, {
                                                        fotos: e.target.files
                                                            ? Array.from(e.target.files)
                                                            : [],
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Total do lote</CardTitle>
                            <CardDescription>Soma automática dos itens.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-8 text-sm">
                            <div>
                                <p className="text-muted-foreground">Quantidade total</p>
                                <p className="text-lg font-semibold">
                                    {totalLote.quantidade.toLocaleString('pt-BR', {
                                        maximumFractionDigits: 4,
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Valor total</p>
                                <p className="text-lg font-semibold">{formatBrl(totalLote.valor)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-wrap justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowSairDialog(true)}
                        >
                            Descartar
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Enviando…' : 'Registrar entrada'}
                        </Button>
                    </div>
                </form>
            </div>

            <AlertDialog open={showSairDialog} onOpenChange={setShowSairDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sair sem registrar?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Os dados preenchidos serão perdidos. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Voltar ao formulário</AlertDialogCancel>
                        <Button asChild variant="default">
                            <Link href={BASE}>Sair para a lista</Link>
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

NovaEntradaLote.layout = {
    breadcrumbs: [
        { title: 'Operações', href: BASE },
        { title: 'Estoque', href: BASE },
        { title: 'Entradas em lote', href: BASE },
        { title: 'Nova', href: `${BASE}/nova` },
    ] satisfies BreadcrumbItem[],
};
