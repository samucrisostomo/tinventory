import { Head, router, useForm, usePage } from '@inertiajs/react';
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import type { BreadcrumbItem } from '@/types';

type FornecedorListItem = {
    id: number;
    nome: string;
    nome_fantasia: string | null;
    cnpj: string;
    inscricao_estadual: string | null;
    inscricao_municipal: string | null;
    email: string | null;
    telefone: string | null;
    celular: string | null;
    site: string | null;
    endereco: string | null;
    numero: string | null;
    complemento: string | null;
    bairro: string | null;
    cidade: string | null;
    estado: string | null;
    cep: string | null;
    observacoes: string | null;
    ativo: boolean;
    created_at: string;
};

type Props = {
    fornecedores: FornecedorListItem[];
};

const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);

    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) {
        return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    }
    if (digits.length <= 12) {
        return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    }

    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);

    if (digits.length <= 5) return digits;

    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const getSiteUrl = (site: string | null) => {
    if (!site) {
        return null;
    }

    const trimmed = site.trim();

    if (!trimmed) {
        return null;
    }

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }

    return `https://${trimmed}`;
};

export default function FornecedoresIndex({ fornecedores }: Props) {
    const { flash } = usePage().props as {
        flash?: {
            success?: string;
            error?: string;
        };
    };

    const [sheetMode, setSheetMode] = useState<'create' | 'edit'>('create');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingFornecedorId, setEditingFornecedorId] = useState<number | null>(
        null,
    );
    const [fornecedorToDelete, setFornecedorToDelete] =
        useState<FornecedorListItem | null>(null);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const form = useForm({
        nome: '',
        nome_fantasia: '',
        cnpj: '',
        inscricao_estadual: '',
        inscricao_municipal: '',
        email: '',
        telefone: '',
        celular: '',
        site: '',
        endereco: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: '',
        observacoes: '',
    });

    const openCreateSheet = () => {
        setSheetMode('create');
        setEditingFornecedorId(null);
        form.reset();
        form.clearErrors();
        setSheetOpen(true);
    };

    const openEditSheet = (fornecedor: FornecedorListItem) => {
        setSheetMode('edit');
        setEditingFornecedorId(fornecedor.id);
        form.setData({
            nome: fornecedor.nome,
            nome_fantasia: fornecedor.nome_fantasia ?? '',
            cnpj: fornecedor.cnpj,
            inscricao_estadual: fornecedor.inscricao_estadual ?? '',
            inscricao_municipal: fornecedor.inscricao_municipal ?? '',
            email: fornecedor.email ?? '',
            telefone: fornecedor.telefone ?? '',
            celular: fornecedor.celular ?? '',
            site: fornecedor.site ?? '',
            endereco: fornecedor.endereco ?? '',
            numero: fornecedor.numero ?? '',
            complemento: fornecedor.complemento ?? '',
            bairro: fornecedor.bairro ?? '',
            cidade: fornecedor.cidade ?? '',
            estado: fornecedor.estado ?? '',
            cep: fornecedor.cep ?? '',
            observacoes: fornecedor.observacoes ?? '',
        });
        form.clearErrors();
        setSheetOpen(true);
    };

    const submitForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (sheetMode === 'create') {
            form.post('/fornecedores', {
                preserveScroll: true,
                onSuccess: () => {
                    form.reset();
                    setSheetOpen(false);
                },
            });
            return;
        }

        if (!editingFornecedorId) return;

        form.patch(`/fornecedores/${editingFornecedorId}`, {
            preserveScroll: true,
            onSuccess: () => setSheetOpen(false),
        });
    };

    const toggleFornecedorStatus = (
        fornecedor: FornecedorListItem,
        checked: boolean,
    ) => {
        router.patch(
            `/fornecedores/${fornecedor.id}/status`,
            {},
            {
                preserveScroll: true,
                onBefore: () => {
                    if (checked === fornecedor.ativo) {
                        return false;
                    }
                },
            },
        );
    };

    const confirmDeleteFornecedor = () => {
        if (!fornecedorToDelete) return;

        router.delete(`/fornecedores/${fornecedorToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => setFornecedorToDelete(null),
        });
    };

    return (
        <>
            <Head title="Fornecedores" />

            <div className="p-4">
                <div className="mb-4 flex items-center justify-between gap-2">
                    <h1 className="text-lg font-semibold">Fornecedores</h1>
                    <Button onClick={openCreateSheet}>Novo fornecedor</Button>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium">Nome</th>
                                <th className="px-4 py-3 font-medium">
                                    Nome fantasia
                                </th>
                                <th className="px-4 py-3 font-medium">CNPJ</th>
                                <th className="px-4 py-3 font-medium">Site</th>
                                <th className="px-4 py-3 font-medium">
                                    Cidade/UF
                                </th>
                                <th className="px-4 py-3 font-medium">Ativo</th>
                                <th className="px-4 py-3 font-medium">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fornecedores.map((fornecedor) => {
                                const siteUrl = getSiteUrl(fornecedor.site);

                                return (
                                    <tr
                                        key={fornecedor.id}
                                        className="border-t border-border"
                                    >
                                        <td className="px-4 py-3">
                                            {fornecedor.nome}
                                        </td>
                                        <td className="px-4 py-3">
                                            {fornecedor.nome_fantasia ?? '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {fornecedor.cnpj}
                                        </td>
                                        <td className="px-4 py-3">
                                            {siteUrl ? (
                                                <a
                                                    href={siteUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary underline-offset-2 hover:underline"
                                                >
                                                    {fornecedor.site}
                                                </a>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {[fornecedor.cidade, fornecedor.estado]
                                                .filter(Boolean)
                                                .join(' / ') || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Switch
                                                checked={fornecedor.ativo}
                                                onCheckedChange={(checked) =>
                                                    toggleFornecedorStatus(
                                                        fornecedor,
                                                        checked,
                                                    )
                                                }
                                                aria-label={`Alternar status do fornecedor ${fornecedor.nome}`}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        aria-label={`Abrir ações de ${fornecedor.nome}`}
                                                    >
                                                        <EllipsisVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            openEditSheet(
                                                                fornecedor,
                                                            )
                                                        }
                                                    >
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() =>
                                                            setFornecedorToDelete(
                                                                fornecedor,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Deletar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent side="right" className="w-full sm:max-w-2xl">
                    <form onSubmit={submitForm} className="flex h-full flex-col">
                        <SheetHeader>
                            <SheetTitle>
                                {sheetMode === 'create'
                                    ? 'Criar fornecedor'
                                    : 'Editar fornecedor'}
                            </SheetTitle>
                            <SheetDescription>
                                {sheetMode === 'create'
                                    ? 'Preencha os dados para criar um novo fornecedor.'
                                    : 'Atualize os dados do fornecedor selecionado.'}
                            </SheetDescription>
                        </SheetHeader>

                        <div className="flex-1 space-y-4 overflow-y-auto px-4">
                            <div className="space-y-2">
                                <Label htmlFor="nome">Nome *</Label>
                                <Input
                                    id="nome"
                                    value={form.data.nome}
                                    onChange={(event) =>
                                        form.setData('nome', event.target.value)
                                    }
                                />
                                {form.errors.nome && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.nome}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nome_fantasia">Nome fantasia</Label>
                                <Input
                                    id="nome_fantasia"
                                    value={form.data.nome_fantasia}
                                    onChange={(event) =>
                                        form.setData(
                                            'nome_fantasia',
                                            event.target.value,
                                        )
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cnpj">CNPJ *</Label>
                                <Input
                                    id="cnpj"
                                    value={form.data.cnpj}
                                    onChange={(event) =>
                                        form.setData(
                                            'cnpj',
                                            formatCnpj(event.target.value),
                                        )
                                    }
                                />
                                {form.errors.cnpj && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.cnpj}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="inscricao_estadual">
                                        Inscrição estadual
                                    </Label>
                                    <Input
                                        id="inscricao_estadual"
                                        value={form.data.inscricao_estadual}
                                        onChange={(event) =>
                                            form.setData(
                                                'inscricao_estadual',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="inscricao_municipal">
                                        Inscrição municipal
                                    </Label>
                                    <Input
                                        id="inscricao_municipal"
                                        value={form.data.inscricao_municipal}
                                        onChange={(event) =>
                                            form.setData(
                                                'inscricao_municipal',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="email">E-mail</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={form.data.email}
                                        onChange={(event) =>
                                            form.setData('email', event.target.value)
                                        }
                                    />
                                    {form.errors.email && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.email}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="site">Site</Label>
                                    <Input
                                        id="site"
                                        value={form.data.site}
                                        onChange={(event) =>
                                            form.setData('site', event.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="telefone">Telefone</Label>
                                    <Input
                                        id="telefone"
                                        value={form.data.telefone}
                                        onChange={(event) =>
                                            form.setData(
                                                'telefone',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="celular">Celular</Label>
                                    <Input
                                        id="celular"
                                        value={form.data.celular}
                                        onChange={(event) =>
                                            form.setData(
                                                'celular',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="endereco">Endereço</Label>
                                <Input
                                    id="endereco"
                                    value={form.data.endereco}
                                    onChange={(event) =>
                                        form.setData('endereco', event.target.value)
                                    }
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="numero">Número</Label>
                                    <Input
                                        id="numero"
                                        value={form.data.numero}
                                        onChange={(event) =>
                                            form.setData('numero', event.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="complemento">Complemento</Label>
                                    <Input
                                        id="complemento"
                                        value={form.data.complemento}
                                        onChange={(event) =>
                                            form.setData(
                                                'complemento',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="bairro">Bairro</Label>
                                    <Input
                                        id="bairro"
                                        value={form.data.bairro}
                                        onChange={(event) =>
                                            form.setData('bairro', event.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cidade">Cidade</Label>
                                    <Input
                                        id="cidade"
                                        value={form.data.cidade}
                                        onChange={(event) =>
                                            form.setData('cidade', event.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="estado">Estado (UF)</Label>
                                    <Input
                                        id="estado"
                                        maxLength={2}
                                        value={form.data.estado}
                                        onChange={(event) =>
                                            form.setData(
                                                'estado',
                                                event.target.value.toUpperCase(),
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cep">CEP</Label>
                                <Input
                                    id="cep"
                                    value={form.data.cep}
                                    onChange={(event) =>
                                        form.setData(
                                            'cep',
                                            formatCep(event.target.value),
                                        )
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="observacoes">Observações</Label>
                                <Input
                                    id="observacoes"
                                    value={form.data.observacoes}
                                    onChange={(event) =>
                                        form.setData(
                                            'observacoes',
                                            event.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>

                        <SheetFooter className="flex-row items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSheetOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {sheetMode === 'create' ? 'Criar' : 'Salvar'}
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            <AlertDialog
                open={Boolean(fornecedorToDelete)}
                onOpenChange={(open) => {
                    if (!open) setFornecedorToDelete(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Tem certeza que deseja deletar este fornecedor?
                        </AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteFornecedor}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Sim, deletar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

FornecedoresIndex.layout = {
    breadcrumbs: [
        {
            title: 'Fornecedores',
            href: '/fornecedores',
        },
    ] satisfies BreadcrumbItem[],
};
