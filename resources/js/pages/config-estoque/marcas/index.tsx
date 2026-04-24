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

const MARCAS_BASE = '/config-estoque/marcas';

/** Valor sentinela para o Select permanecer sempre controlado (evita undefined → string no Radix). */
const SELECT_TIPO_MATERIAL_VAZIO = '__none__';

type TipoMaterialOption = {
    id: number;
    nome: string;
};

type MarcaListItem = {
    id: number;
    nome: string;
    descricao: string | null;
    tipo_material_id: number;
    tipo_material: {
        id: number;
        nome: string;
    };
    ativo: boolean;
    created_at: string;
    updated_at: string;
};

type Props = {
    marcas: MarcaListItem[];
    tiposMateriais: TipoMaterialOption[];
};

export default function MarcasIndex({ marcas, tiposMateriais }: Props) {
    const { flash } = usePage().props as {
        flash?: {
            success?: string;
            error?: string;
        };
    };

    const [sheetMode, setSheetMode] = useState<'create' | 'edit'>('create');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingMarcaId, setEditingMarcaId] = useState<number | null>(null);
    const [marcaToDelete, setMarcaToDelete] = useState<MarcaListItem | null>(null);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    const form = useForm({
        nome: '',
        descricao: '',
        tipo_material_id: '',
    });

    const openCreateSheet = () => {
        setSheetMode('create');
        setEditingMarcaId(null);
        form.reset();
        form.clearErrors();
        setSheetOpen(true);
    };

    const openEditSheet = (marca: MarcaListItem) => {
        setSheetMode('edit');
        setEditingMarcaId(marca.id);
        form.setData({
            nome: marca.nome,
            descricao: marca.descricao ?? '',
            tipo_material_id: String(marca.tipo_material_id),
        });
        form.clearErrors();
        setSheetOpen(true);
    };

    const submitForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (sheetMode === 'create') {
            form.post(MARCAS_BASE, {
                preserveScroll: true,
                onSuccess: () => {
                    form.reset();
                    setSheetOpen(false);
                },
            });
            return;
        }

        if (!editingMarcaId) return;

        form.patch(`${MARCAS_BASE}/${editingMarcaId}`, {
            preserveScroll: true,
            onSuccess: () => setSheetOpen(false),
        });
    };

    const toggleMarcaStatus = (marca: MarcaListItem, checked: boolean) => {
        router.patch(
            `${MARCAS_BASE}/${marca.id}/status`,
            {},
            {
                preserveScroll: true,
                onBefore: () => {
                    if (checked === marca.ativo) return false;
                },
            },
        );
    };

    const confirmDeleteMarca = () => {
        if (!marcaToDelete) return;

        router.delete(`${MARCAS_BASE}/${marcaToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => setMarcaToDelete(null),
        });
    };

    return (
        <>
            <Head title="Marcas" />

            <div className="p-4">
                <div className="mb-4 flex items-center justify-between gap-2">
                    <h1 className="text-lg font-semibold">Marcas</h1>
                    <Button onClick={openCreateSheet}>Nova marca</Button>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium">Nome</th>
                                <th className="px-4 py-3 font-medium">Descrição</th>
                                <th className="px-4 py-3 font-medium">Tipo material</th>
                                <th className="px-4 py-3 font-medium">Ativo</th>
                                <th className="px-4 py-3 font-medium">Criado em</th>
                                <th className="px-4 py-3 font-medium">Atualizado em</th>
                                <th className="px-4 py-3 font-medium">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {marcas.map((marca) => (
                                <tr key={marca.id} className="border-t border-border">
                                    <td className="px-4 py-3">{marca.nome}</td>
                                    <td className="px-4 py-3">{marca.descricao || '-'}</td>
                                    <td className="px-4 py-3">
                                        {marca.tipo_material?.nome ?? '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Switch
                                            checked={marca.ativo}
                                            onCheckedChange={(checked) =>
                                                toggleMarcaStatus(marca, checked)
                                            }
                                            aria-label={`Alternar status da marca ${marca.nome}`}
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        {new Date(marca.created_at).toLocaleString('pt-BR')}
                                    </td>
                                    <td className="px-4 py-3">
                                        {new Date(marca.updated_at).toLocaleString('pt-BR')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    aria-label={`Abrir ações de ${marca.nome}`}
                                                >
                                                    <EllipsisVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => openEditSheet(marca)}
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => setMarcaToDelete(marca)}
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
                                {sheetMode === 'create' ? 'Criar marca' : 'Editar marca'}
                            </SheetTitle>
                            <SheetDescription>
                                {sheetMode === 'create'
                                    ? 'Cadastre uma nova marca vinculada a um tipo de material.'
                                    : 'Atualize os dados da marca selecionada.'}
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
                                <Label htmlFor="descricao">Descrição</Label>
                                <Input
                                    id="descricao"
                                    value={form.data.descricao}
                                    onChange={(event) =>
                                        form.setData('descricao', event.target.value)
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tipo_material_id">Tipo material *</Label>
                                <Select
                                    value={
                                        form.data.tipo_material_id === ''
                                            ? SELECT_TIPO_MATERIAL_VAZIO
                                            : form.data.tipo_material_id
                                    }
                                    onValueChange={(value) =>
                                        form.setData(
                                            'tipo_material_id',
                                            value === SELECT_TIPO_MATERIAL_VAZIO
                                                ? ''
                                                : value,
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        id="tipo_material_id"
                                        className="w-full"
                                        aria-invalid={Boolean(form.errors.tipo_material_id)}
                                    >
                                        <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                        <SelectItem
                                            value={SELECT_TIPO_MATERIAL_VAZIO}
                                            disabled
                                        >
                                            Selecione o tipo
                                        </SelectItem>
                                        {tiposMateriais.map((tipo) => (
                                            <SelectItem
                                                key={tipo.id}
                                                value={String(tipo.id)}
                                            >
                                                {tipo.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.tipo_material_id && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.tipo_material_id}
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
                open={Boolean(marcaToDelete)}
                onOpenChange={(open) => {
                    if (!open) setMarcaToDelete(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Tem certeza que deseja deletar esta marca?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. A marca será removida do cadastro.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteMarca}
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

MarcasIndex.layout = {
    breadcrumbs: [
        {
            title: 'Configurações',
            href: MARCAS_BASE,
        },
        {
            title: 'Estoque',
            href: MARCAS_BASE,
        },
        {
            title: 'Marcas',
            href: MARCAS_BASE,
        },
    ] satisfies BreadcrumbItem[],
};
