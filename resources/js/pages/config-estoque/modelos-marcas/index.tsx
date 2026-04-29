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

const MODELOS_MARCAS_BASE = '/config-estoque/modelos-marcas';
const SELECT_MARCA_VAZIO = '__none__';

type MarcaOption = {
    id: number;
    nome: string;
};

type ModeloMarcaListItem = {
    id: number;
    marcas_id: number;
    nome: string;
    descricao: string | null;
    ativo: boolean;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    marca: {
        id: number;
        nome: string;
    };
};

type Props = {
    modelosMarcas: ModeloMarcaListItem[];
    marcas: MarcaOption[];
};

export default function ModelosMarcasIndex({ modelosMarcas, marcas }: Props) {
    const { flash } = usePage().props as {
        flash?: {
            success?: string;
            error?: string;
        };
    };

    const [sheetMode, setSheetMode] = useState<'create' | 'edit'>('create');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingModeloMarcaId, setEditingModeloMarcaId] = useState<number | null>(
        null,
    );
    const [modeloMarcaToDelete, setModeloMarcaToDelete] =
        useState<ModeloMarcaListItem | null>(null);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash?.success, flash?.error]);

    const form = useForm({
        marcas_id: '',
        nome: '',
        descricao: '',
    });

    const openCreateSheet = () => {
        setSheetMode('create');
        setEditingModeloMarcaId(null);
        form.reset();
        form.clearErrors();
        setSheetOpen(true);
    };

    const openEditSheet = (modeloMarca: ModeloMarcaListItem) => {
        setSheetMode('edit');
        setEditingModeloMarcaId(modeloMarca.id);
        form.setData({
            marcas_id: String(modeloMarca.marcas_id),
            nome: modeloMarca.nome,
            descricao: modeloMarca.descricao,
        });
        form.clearErrors();
        setSheetOpen(true);
    };

    const submitForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (sheetMode === 'create') {
            form.post(MODELOS_MARCAS_BASE, {
                preserveScroll: true,
                onSuccess: () => {
                    form.reset();
                    setSheetOpen(false);
                },
            });
            return;
        }

        if (!editingModeloMarcaId) {
            return;
        }

        form.patch(`${MODELOS_MARCAS_BASE}/${editingModeloMarcaId}`, {
            preserveScroll: true,
            onSuccess: () => setSheetOpen(false),
        });
    };

    const toggleModeloMarcaStatus = (
        modeloMarca: ModeloMarcaListItem,
        checked: boolean,
    ) => {
        router.patch(
            `${MODELOS_MARCAS_BASE}/${modeloMarca.id}/status`,
            {},
            {
                preserveScroll: true,
                onBefore: () => {
                    if (checked === modeloMarca.ativo) {
                        return false;
                    }
                },
            },
        );
    };

    const confirmDeleteModeloMarca = () => {
        if (!modeloMarcaToDelete) {
            return;
        }

        router.delete(`${MODELOS_MARCAS_BASE}/${modeloMarcaToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => setModeloMarcaToDelete(null),
        });
    };

    return (
        <>
            <Head title="Modelos de Marcas" />

            <div className="p-4">
                <div className="mb-4 flex items-center justify-between gap-2">
                    <h1 className="text-lg font-semibold">Modelos de Marcas</h1>
                    <Button onClick={openCreateSheet}>Novo modelo</Button>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium">ID</th>
                                <th className="px-4 py-3 font-medium">Marca</th>
                                <th className="px-4 py-3 font-medium">Modelo</th>
                                <th className="px-4 py-3 font-medium">Descrição</th>
                                <th className="px-4 py-3 font-medium">Ativo</th>
                                <th className="px-4 py-3 font-medium">Criado em</th>
                                <th className="px-4 py-3 font-medium">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {modelosMarcas.map((modeloMarca) => (
                                <tr key={modeloMarca.id} className="border-t border-border">
                                    <td className="px-4 py-3">{modeloMarca.id}</td>
                                    <td className="px-4 py-3">
                                        {modeloMarca.marca?.nome ?? '-'}
                                    </td>
                                    <td className="px-4 py-3">{modeloMarca.nome}</td>
                                    <td className="px-4 py-3">{modeloMarca.descricao || '-'}</td>
                                    <td className="px-4 py-3">
                                        <Switch
                                            checked={modeloMarca.ativo}
                                            onCheckedChange={(checked) =>
                                                toggleModeloMarcaStatus(modeloMarca, checked)
                                            }
                                            aria-label={`Alternar status do modelo ${modeloMarca.descricao}`}
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        {new Date(modeloMarca.created_at).toLocaleString(
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
                                                    aria-label={`Abrir ações de ${modeloMarca.descricao}`}
                                                >
                                                    <EllipsisVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        openEditSheet(modeloMarca)
                                                    }
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        setModeloMarcaToDelete(modeloMarca)
                                                    }
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Excluir
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
                                    ? 'Criar modelo de marca'
                                    : 'Editar modelo de marca'}
                            </SheetTitle>
                            <SheetDescription>
                                {sheetMode === 'create'
                                    ? 'Cadastre um novo modelo para uma marca.'
                                    : 'Atualize os dados do modelo de marca selecionado.'}
                            </SheetDescription>
                        </SheetHeader>

                        <div className="flex-1 space-y-4 overflow-y-auto px-4">
                            <div className="space-y-2">
                                <Label htmlFor="marcas_id">Marca *</Label>
                                <Select
                                    value={
                                        form.data.marcas_id === ''
                                            ? SELECT_MARCA_VAZIO
                                            : form.data.marcas_id
                                    }
                                    onValueChange={(value) =>
                                        form.setData(
                                            'marcas_id',
                                            value === SELECT_MARCA_VAZIO ? '' : value,
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        id="marcas_id"
                                        className="w-full"
                                        aria-invalid={Boolean(form.errors.marcas_id)}
                                    >
                                        <SelectValue placeholder="Selecione a marca" />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                        <SelectItem value={SELECT_MARCA_VAZIO} disabled>
                                            Selecione a marca
                                        </SelectItem>
                                        {marcas.map((marca) => (
                                            <SelectItem key={marca.id} value={String(marca.id)}>
                                                {marca.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.marcas_id && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.marcas_id}
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
                                <Label htmlFor="descricao">Descrição</Label>
                                <Input
                                    id="descricao"
                                    value={form.data.descricao}
                                    onChange={(event) =>
                                        form.setData('descricao', event.target.value)
                                    }
                                />
                                {form.errors.descricao && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.descricao}
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
                open={Boolean(modeloMarcaToDelete)}
                onOpenChange={(open) => {
                    if (!open) {
                        setModeloMarcaToDelete(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir modelo de marca?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O modelo será removido do
                            cadastro.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteModeloMarca}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Sim, excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

ModelosMarcasIndex.layout = {
    breadcrumbs: [
        {
            title: 'Configurações',
            href: MODELOS_MARCAS_BASE,
        },
        {
            title: 'Estoque',
            href: MODELOS_MARCAS_BASE,
        },
        {
            title: 'Modelos de Marcas',
            href: MODELOS_MARCAS_BASE,
        },
    ] satisfies BreadcrumbItem[],
};
