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
    AlertDialogDescription,
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

const TIPOS_ESTOQUE_BASE = '/config-estoque/tipos-estoque';

type TipoEstoqueListItem = {
    id: number;
    codigo: string;
    descricao: string | null;
    ativo: boolean;
    created_at: string;
    updated_at: string;
};

type Props = {
    tiposEstoque: TipoEstoqueListItem[];
};

export default function TiposEstoqueIndex({ tiposEstoque }: Props) {
    const { flash } = usePage().props as {
        flash?: {
            success?: string;
            error?: string;
        };
    };

    const [sheetMode, setSheetMode] = useState<'create' | 'edit'>('create');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingTipoEstoqueId, setEditingTipoEstoqueId] = useState<number | null>(
        null,
    );
    const [tipoEstoqueToDelete, setTipoEstoqueToDelete] =
        useState<TipoEstoqueListItem | null>(null);

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
        descricao: '',
    });

    const openCreateSheet = () => {
        setSheetMode('create');
        setEditingTipoEstoqueId(null);
        form.reset();
        form.clearErrors();
        setSheetOpen(true);
    };

    const openEditSheet = (tipoEstoque: TipoEstoqueListItem) => {
        setSheetMode('edit');
        setEditingTipoEstoqueId(tipoEstoque.id);
        form.setData({
            codigo: tipoEstoque.codigo,
            descricao: tipoEstoque.descricao ?? '',
        });
        form.clearErrors();
        setSheetOpen(true);
    };

    const submitForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (sheetMode === 'create') {
            form.post(TIPOS_ESTOQUE_BASE, {
                preserveScroll: true,
                onSuccess: () => {
                    form.reset();
                    setSheetOpen(false);
                },
            });

            return;
        }

        if (!editingTipoEstoqueId) {
            return;
        }

        form.patch(`${TIPOS_ESTOQUE_BASE}/${editingTipoEstoqueId}`, {
            preserveScroll: true,
            onSuccess: () => setSheetOpen(false),
        });
    };

    const toggleTipoEstoqueStatus = (
        tipoEstoque: TipoEstoqueListItem,
        checked: boolean,
    ) => {
        router.patch(
            `${TIPOS_ESTOQUE_BASE}/${tipoEstoque.id}/status`,
            {},
            {
                preserveScroll: true,
                onBefore: () => {
                    if (checked === tipoEstoque.ativo) {
                        return false;
                    }
                },
            },
        );
    };

    const confirmDeleteTipoEstoque = () => {
        if (!tipoEstoqueToDelete) {
            return;
        }

        router.delete(`${TIPOS_ESTOQUE_BASE}/${tipoEstoqueToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => setTipoEstoqueToDelete(null),
        });
    };

    return (
        <>
            <Head title="Tipo Estoque" />

            <div className="p-4">
                <div className="mb-4 flex items-center justify-between gap-2">
                    <h1 className="text-lg font-semibold">Tipo Estoque</h1>
                    <Button onClick={openCreateSheet}>Novo tipo estoque</Button>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium">Código</th>
                                <th className="px-4 py-3 font-medium">Descrição</th>
                                <th className="px-4 py-3 font-medium">Ativo</th>
                                <th className="px-4 py-3 font-medium">Criado em</th>
                                <th className="px-4 py-3 font-medium">Atualizado em</th>
                                <th className="px-4 py-3 font-medium">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tiposEstoque.map((tipoEstoque) => (
                                <tr
                                    key={tipoEstoque.id}
                                    className="border-t border-border"
                                >
                                    <td className="px-4 py-3">{tipoEstoque.codigo}</td>
                                    <td className="px-4 py-3">
                                        {tipoEstoque.descricao || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Switch
                                            checked={tipoEstoque.ativo}
                                            onCheckedChange={(checked) =>
                                                toggleTipoEstoqueStatus(
                                                    tipoEstoque,
                                                    checked,
                                                )
                                            }
                                            aria-label={`Alternar status do tipo de estoque ${tipoEstoque.codigo}`}
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        {new Date(tipoEstoque.created_at).toLocaleString(
                                            'pt-BR',
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {new Date(tipoEstoque.updated_at).toLocaleString(
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
                                                    aria-label={`Abrir ações de ${tipoEstoque.codigo}`}
                                                >
                                                    <EllipsisVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        openEditSheet(tipoEstoque)
                                                    }
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() =>
                                                        setTipoEstoqueToDelete(tipoEstoque)
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
                                    ? 'Criar tipo estoque'
                                    : 'Editar tipo estoque'}
                            </SheetTitle>
                            <SheetDescription>
                                {sheetMode === 'create'
                                    ? 'Cadastre um novo tipo de estoque.'
                                    : 'Atualize os dados do tipo de estoque selecionado.'}
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
                                <Label htmlFor="descricao">Descrição</Label>
                                <Input
                                    id="descricao"
                                    value={form.data.descricao}
                                    onChange={(event) =>
                                        form.setData('descricao', event.target.value)
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
                open={Boolean(tipoEstoqueToDelete)}
                onOpenChange={(open) => {
                    if (!open) {
                        setTipoEstoqueToDelete(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Tem certeza que deseja deletar este tipo de estoque?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O tipo de estoque será removido do
                            cadastro.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteTipoEstoque}
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

TiposEstoqueIndex.layout = {
    breadcrumbs: [
        {
            title: 'Configurações',
            href: TIPOS_ESTOQUE_BASE,
        },
        {
            title: 'Estoque',
            href: TIPOS_ESTOQUE_BASE,
        },
        {
            title: 'Tipo Estoque',
            href: TIPOS_ESTOQUE_BASE,
        },
    ] satisfies BreadcrumbItem[],
};
