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

type EmpresaListItem = {
    id: number;
    codigo: string;
    nome: string;
    cnpj: string;
    endereco: string | null;
    cidade: string | null;
    estado: string | null;
    cep: string | null;
    telefone: string | null;
    email: string | null;
    observacoes: string | null;
    ativa: boolean;
    created_at: string;
};

type Props = {
    empresas: EmpresaListItem[];
};

const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);

    if (digits.length <= 2) {
        return digits;
    }

    if (digits.length <= 5) {
        return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    }

    if (digits.length <= 8) {
        return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    }

    if (digits.length <= 12) {
        return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    }

    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

export default function EmpresasIndex({ empresas }: Props) {
    const { flash } = usePage().props as {
        flash?: {
            success?: string;
            error?: string;
        };
    };

    const [sheetMode, setSheetMode] = useState<'create' | 'edit'>('create');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingEmpresaId, setEditingEmpresaId] = useState<number | null>(null);
    const [empresaToDelete, setEmpresaToDelete] = useState<EmpresaListItem | null>(
        null,
    );

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash?.success, flash?.error]);

    const form = useForm({
        codigo: '',
        nome: '',
        cnpj: '',
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
        telefone: '',
        email: '',
        observacoes: '',
    });

    const openCreateSheet = () => {
        setSheetMode('create');
        setEditingEmpresaId(null);
        form.reset();
        form.clearErrors();
        setSheetOpen(true);
    };

    const openEditSheet = (empresa: EmpresaListItem) => {
        setSheetMode('edit');
        setEditingEmpresaId(empresa.id);
        form.setData({
            codigo: empresa.codigo,
            nome: empresa.nome,
            cnpj: empresa.cnpj,
            endereco: empresa.endereco ?? '',
            cidade: empresa.cidade ?? '',
            estado: empresa.estado ?? '',
            cep: empresa.cep ?? '',
            telefone: empresa.telefone ?? '',
            email: empresa.email ?? '',
            observacoes: empresa.observacoes ?? '',
        });
        form.clearErrors();
        setSheetOpen(true);
    };

    const submitForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (sheetMode === 'create') {
            form.post('/empresas', {
                preserveScroll: true,
                onSuccess: () => {
                    form.reset();
                    setSheetOpen(false);
                },
            });

            return;
        }

        if (!editingEmpresaId) {
            return;
        }

        form.patch(`/empresas/${editingEmpresaId}`, {
            preserveScroll: true,
            onSuccess: () => {
                setSheetOpen(false);
            },
        });
    };

    const toggleEmpresaStatus = (empresa: EmpresaListItem, checked: boolean) => {
        router.patch(
            `/empresas/${empresa.id}/status`,
            {},
            {
                preserveScroll: true,
                onBefore: () => {
                    if (checked === empresa.ativa) {
                        return false;
                    }
                },
            },
        );
    };

    const confirmDeleteEmpresa = () => {
        if (!empresaToDelete) {
            return;
        }

        router.delete(`/empresas/${empresaToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEmpresaToDelete(null);
            },
        });
    };

    return (
        <>
            <Head title="Empresas" />

            <div className="p-4">
                <div className="mb-4 flex items-center justify-between gap-2">
                    <h1 className="text-lg font-semibold">Empresas</h1>
                    <Button onClick={openCreateSheet}>Nova empresa</Button>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium">Código</th>
                                <th className="px-4 py-3 font-medium">Nome</th>
                                <th className="px-4 py-3 font-medium">CNPJ</th>
                                <th className="px-4 py-3 font-medium">Cidade/UF</th>
                                <th className="px-4 py-3 font-medium">Ativa</th>
                                <th className="px-4 py-3 font-medium">Criada em</th>
                                <th className="px-4 py-3 font-medium">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {empresas.map((empresa) => (
                                <tr key={empresa.id} className="border-t border-border">
                                    <td className="px-4 py-3">{empresa.codigo}</td>
                                    <td className="px-4 py-3">{empresa.nome}</td>
                                    <td className="px-4 py-3">{empresa.cnpj}</td>
                                    <td className="px-4 py-3">
                                        {[empresa.cidade, empresa.estado]
                                            .filter(Boolean)
                                            .join(' / ') || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Switch
                                            checked={empresa.ativa}
                                            onCheckedChange={(checked) =>
                                                toggleEmpresaStatus(empresa, checked)
                                            }
                                            aria-label={`Alternar status da empresa ${empresa.nome}`}
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        {new Date(empresa.created_at).toLocaleString(
                                            'pt-BR',
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    aria-label={`Abrir ações de ${empresa.nome}`}
                                                >
                                                    <EllipsisVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => openEditSheet(empresa)}
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() =>
                                                        setEmpresaToDelete(empresa)
                                                    }
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4 text-red" />
                                                    Deletar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent side="right" className="w-full sm:max-w-lg">
                    <form onSubmit={submitForm} className="flex h-full flex-col">
                        <SheetHeader>
                            <SheetTitle>
                                {sheetMode === 'create'
                                    ? 'Criar empresa'
                                    : 'Editar empresa'}
                            </SheetTitle>
                            <SheetDescription>
                                {sheetMode === 'create'
                                    ? 'Preencha os dados para criar uma nova empresa.'
                                    : 'Atualize os dados da empresa selecionada.'}
                            </SheetDescription>
                        </SheetHeader>

                        <div className="flex-1 space-y-4 overflow-y-auto px-4">
                            <div className="space-y-2">
                                <Label htmlFor="codigo">Código *</Label>
                                <Input
                                    id="codigo"
                                    value={form.data.codigo}
                                    onChange={(event) =>
                                        form.setData('codigo', event.target.value)
                                    }
                                />
                                {form.errors.codigo && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.codigo}
                                    </p>
                                )}
                            </div>

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

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="cep">CEP</Label>
                                    <Input
                                        id="cep"
                                        value={form.data.cep}
                                        onChange={(event) =>
                                            form.setData('cep', event.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="telefone">Telefone</Label>
                                    <Input
                                        id="telefone"
                                        value={form.data.telefone}
                                        onChange={(event) =>
                                            form.setData('telefone', event.target.value)
                                        }
                                    />
                                </div>
                            </div>

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
                                <Label htmlFor="observacoes">Observações</Label>
                                <Input
                                    id="observacoes"
                                    value={form.data.observacoes}
                                    onChange={(event) =>
                                        form.setData('observacoes', event.target.value)
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
                open={Boolean(empresaToDelete)}
                onOpenChange={(open) => {
                    if (!open) {
                        setEmpresaToDelete(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Tem certeza que deseja deletar esta empresa?
                        </AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteEmpresa}
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

EmpresasIndex.layout = {
    breadcrumbs: [
        {
            title: 'Empresas',
            href: '/empresas',
        },
    ] satisfies BreadcrumbItem[],
};
