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
import { Badge } from '@/components/ui/badge';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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

type LocalListItem = {
    id: number;
    empresa_id: number;
    empresa: {
        id: number;
        nome: string;
    };
    codigo: string;
    nome: string;
    data_limite: string;
    ativo: boolean;
    created_at: string;
};

type EmpresaOption = {
    id: number;
    nome: string;
};

type Props = {
    locais: LocalListItem[];
    empresas: EmpresaOption[];
};

export default function LocaisIndex({ locais, empresas }: Props) {
    const { flash } = usePage().props as {
        flash?: {
            success?: string;
            error?: string;
        };
    };

    const [sheetMode, setSheetMode] = useState<'create' | 'edit'>('create');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingLocalId, setEditingLocalId] = useState<number | null>(null);
    const [localToDelete, setLocalToDelete] = useState<LocalListItem | null>(null);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const form = useForm({
        empresa_id: '',
        codigo: '',
        nome: '',
        data_limite: '',
    });

    const openCreateSheet = () => {
        setSheetMode('create');
        setEditingLocalId(null);
        form.reset();
        form.clearErrors();
        setSheetOpen(true);
    };

    const openEditSheet = (local: LocalListItem) => {
        setSheetMode('edit');
        setEditingLocalId(local.id);
        form.setData({
            empresa_id: String(local.empresa_id),
            codigo: local.codigo,
            nome: local.nome,
            data_limite: local.data_limite,
        });
        form.clearErrors();
        setSheetOpen(true);
    };

    const submitForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (sheetMode === 'create') {
            form.post('/locais', {
                preserveScroll: true,
                onSuccess: () => {
                    form.reset();
                    setSheetOpen(false);
                },
            });
            return;
        }

        if (!editingLocalId) return;

        form.patch(`/locais/${editingLocalId}`, {
            preserveScroll: true,
            onSuccess: () => setSheetOpen(false),
        });
    };

    const toggleLocalStatus = (local: LocalListItem, checked: boolean) => {
        router.patch(
            `/locais/${local.id}/status`,
            {},
            {
                preserveScroll: true,
                onBefore: () => {
                    if (checked === local.ativo) {
                        return false;
                    }
                },
            },
        );
    };

    const confirmDeleteLocal = () => {
        if (!localToDelete) return;

        router.delete(`/locais/${localToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => setLocalToDelete(null),
        });
    };

    return (
        <>
            <Head title="Locais" />

            <div className="p-4">
                <div className="mb-4 flex items-center justify-between gap-2">
                    <h1 className="text-lg font-semibold">Locais</h1>
                    <Button onClick={openCreateSheet}>Novo local</Button>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium">Código</th>
                                <th className="px-4 py-3 font-medium">Nome</th>
                                <th className="px-4 py-3 font-medium">Empresa</th>
                                <th className="px-4 py-3 font-medium">
                                    Data limite
                                </th>
                                <th className="px-4 py-3 font-medium">Ativo</th>
                                <th className="px-4 py-3 font-medium">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {locais.map((local) => {
                                const localDateLimit = new Date(
                                    `${local.data_limite}T00:00:00`,
                                );
                                const isExpired =
                                    localDateLimit <
                                    new Date(
                                        new Date().toISOString().slice(0, 10) +
                                            'T00:00:00',
                                    );

                                return (
                                <tr key={local.id} className="border-t border-border">
                                    <td className="px-4 py-3">{local.codigo}</td>
                                    <td className="px-4 py-3">{local.nome}</td>
                                    <td className="px-4 py-3">
                                        {local.empresa?.nome ?? '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge
                                            variant={
                                                isExpired
                                                    ? 'destructive'
                                                    : 'secondary'
                                            }
                                        >
                                            {localDateLimit.toLocaleDateString(
                                                'pt-BR',
                                            )}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Switch
                                            checked={local.ativo}
                                            onCheckedChange={(checked) =>
                                                toggleLocalStatus(local, checked)
                                            }
                                            aria-label={`Alternar status do local ${local.codigo}`}
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    aria-label={`Abrir ações de ${local.codigo}`}
                                                >
                                                    <EllipsisVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        openEditSheet(local)
                                                    }
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() =>
                                                        setLocalToDelete(local)
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
                <SheetContent side="right" className="w-full sm:max-w-xl">
                    <form onSubmit={submitForm} className="flex h-full flex-col">
                        <SheetHeader>
                            <SheetTitle>
                                {sheetMode === 'create'
                                    ? 'Criar local'
                                    : 'Editar local'}
                            </SheetTitle>
                            <SheetDescription>
                                {sheetMode === 'create'
                                    ? 'Preencha os dados para criar um novo local.'
                                    : 'Atualize os dados do local selecionado.'}
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
                                <Label htmlFor="empresa_id">Empresa *</Label>
                                <Select
                                    value={
                                        form.data.empresa_id === ''
                                            ? undefined
                                            : form.data.empresa_id
                                    }
                                    onValueChange={(value) =>
                                        form.setData('empresa_id', value)
                                    }
                                >
                                    <SelectTrigger
                                        id="empresa_id"
                                        className="w-full"
                                        aria-invalid={Boolean(form.errors.empresa_id)}
                                    >
                                        <SelectValue placeholder="Selecione a empresa" />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                        {empresas.map((empresa) => (
                                            <SelectItem
                                                key={empresa.id}
                                                value={String(empresa.id)}
                                            >
                                                {empresa.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.empresa_id && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.empresa_id}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="data_limite">Data limite *</Label>
                                <Input
                                    id="data_limite"
                                    type="date"
                                    value={form.data.data_limite}
                                    onChange={(event) =>
                                        form.setData(
                                            'data_limite',
                                            event.target.value,
                                        )
                                    }
                                />
                                {form.errors.data_limite && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.data_limite}
                                    </p>
                                )}
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
                open={Boolean(localToDelete)}
                onOpenChange={(open) => {
                    if (!open) setLocalToDelete(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Tem certeza que deseja deletar este local?
                        </AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteLocal}
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

LocaisIndex.layout = {
    breadcrumbs: [
        {
            title: 'Locais',
            href: '/locais',
        },
    ] satisfies BreadcrumbItem[],
};
