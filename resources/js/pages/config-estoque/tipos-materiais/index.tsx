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

const TIPOS_MATERIAIS_BASE = '/config-estoque/tipos-materiais';

type TipoMaterialListItem = {
    id: number;
    nome: string;
    mascara: string;
    descricao: string | null;
    ativo: boolean;
    rastreavel: boolean;
    created_at: string;
};

type Props = {
    tiposMateriais: TipoMaterialListItem[];
};

const generateMaskFromName = (name: string) => {
    const normalized = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z]/g, '');

    const prefix = normalized.slice(0, 4).padEnd(4, 'X');

    return `${prefix}-0000`;
};

export default function TiposMateriaisIndex({ tiposMateriais }: Props) {
    const { flash } = usePage().props as {
        flash?: {
            success?: string;
            error?: string;
        };
    };

    const [sheetMode, setSheetMode] = useState<'create' | 'edit'>('create');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingTipoMaterialId, setEditingTipoMaterialId] = useState<number | null>(
        null,
    );
    const [tipoMaterialToDelete, setTipoMaterialToDelete] =
        useState<TipoMaterialListItem | null>(null);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash?.success, flash?.error]);

    const form = useForm({
        nome: '',
        descricao: '',
        rastreavel: false,
    });

    const openCreateSheet = () => {
        setSheetMode('create');
        setEditingTipoMaterialId(null);
        form.reset();
        form.clearErrors();
        setSheetOpen(true);
    };

    const openEditSheet = (tipoMaterial: TipoMaterialListItem) => {
        setSheetMode('edit');
        setEditingTipoMaterialId(tipoMaterial.id);
        form.setData({
            nome: tipoMaterial.nome,
            descricao: tipoMaterial.descricao ?? '',
            rastreavel: tipoMaterial.rastreavel,
        });
        form.clearErrors();
        setSheetOpen(true);
    };

    const submitForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (sheetMode === 'create') {
            form.post(TIPOS_MATERIAIS_BASE, {
                preserveScroll: true,
                onSuccess: () => {
                    form.reset();
                    setSheetOpen(false);
                },
            });

            return;
        }

        if (!editingTipoMaterialId) {
            return;
        }

        form.patch(`${TIPOS_MATERIAIS_BASE}/${editingTipoMaterialId}`, {
            preserveScroll: true,
            onSuccess: () => setSheetOpen(false),
        });
    };

    const toggleTipoMaterialStatus = (
        tipoMaterial: TipoMaterialListItem,
        checked: boolean,
    ) => {
        router.patch(
            `${TIPOS_MATERIAIS_BASE}/${tipoMaterial.id}/status`,
            {},
            {
                preserveScroll: true,
                onBefore: () => {
                    if (checked === tipoMaterial.ativo) {
                        return false;
                    }
                },
            },
        );
    };

    const confirmDeleteTipoMaterial = () => {
        if (!tipoMaterialToDelete) {
            return;
        }

        router.delete(`${TIPOS_MATERIAIS_BASE}/${tipoMaterialToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => setTipoMaterialToDelete(null),
        });
    };

    const maskPreview = generateMaskFromName(form.data.nome);

    return (
        <>
            <Head title="Tipo Material" />

            <div className="p-4">
                <div className="mb-4 flex items-center justify-between gap-2">
                    <h1 className="text-lg font-semibold">Tipo Material</h1>
                    <Button onClick={openCreateSheet}>Novo tipo material</Button>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium">Nome</th>
                                <th className="px-4 py-3 font-medium">Máscara</th>
                                <th className="px-4 py-3 font-medium">Descrição</th>
                                <th className="px-4 py-3 font-medium">Rastreável</th>
                                <th className="px-4 py-3 font-medium">Ativo</th>
                                <th className="px-4 py-3 font-medium">Criado em</th>
                                <th className="px-4 py-3 font-medium">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tiposMateriais.map((tipoMaterial) => (
                                <tr
                                    key={tipoMaterial.id}
                                    className="border-t border-border"
                                >
                                    <td className="px-4 py-3">{tipoMaterial.nome}</td>
                                    <td className="px-4 py-3">{tipoMaterial.mascara}</td>
                                    <td className="px-4 py-3">
                                        {tipoMaterial.descricao || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Switch
                                            checked={tipoMaterial.rastreavel}
                                            disabled
                                            aria-label={`Rastreável de ${tipoMaterial.nome}`}
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <Switch
                                            checked={tipoMaterial.ativo}
                                            onCheckedChange={(checked) =>
                                                toggleTipoMaterialStatus(
                                                    tipoMaterial,
                                                    checked,
                                                )
                                            }
                                            aria-label={`Alternar status do tipo de material ${tipoMaterial.nome}`}
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        {new Date(tipoMaterial.created_at).toLocaleString(
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
                                                    aria-label={`Abrir ações de ${tipoMaterial.nome}`}
                                                >
                                                    <EllipsisVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        openEditSheet(tipoMaterial)
                                                    }
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() =>
                                                        setTipoMaterialToDelete(
                                                            tipoMaterial,
                                                        )
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
                                    ? 'Criar tipo material'
                                    : 'Editar tipo material'}
                            </SheetTitle>
                            <SheetDescription>
                                {sheetMode === 'create'
                                    ? 'Cadastre um novo tipo de material para o estoque.'
                                    : 'Atualize os dados do tipo de material selecionado.'}
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
                                <Label htmlFor="mascara">Máscara</Label>
                                <Input id="mascara" value={maskPreview} readOnly />
                                <p className="text-xs text-muted-foreground">
                                    Máscara automática no padrão XXXX-0000.
                                </p>
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

                            <div className="flex items-center justify-between rounded-md border px-3 py-2">
                                <div>
                                    <p className="text-sm font-medium">Rastreável</p>
                                    <p className="text-xs text-muted-foreground">
                                        Campo previsto para uso futuro.
                                    </p>
                                </div>
                                <Switch
                                    checked={form.data.rastreavel}
                                    onCheckedChange={(checked) =>
                                        form.setData('rastreavel', checked)
                                    }
                                    aria-label="Definir se o tipo de material é rastreável"
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
                open={Boolean(tipoMaterialToDelete)}
                onOpenChange={(open) => {
                    if (!open) {
                        setTipoMaterialToDelete(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Tem certeza que deseja deletar este tipo de material?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O tipo de material será removido do
                            cadastro.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteTipoMaterial}
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

TiposMateriaisIndex.layout = {
    breadcrumbs: [
        {
            title: 'Configurações',
            href: TIPOS_MATERIAIS_BASE,
        },
        {
            title: 'Estoque',
            href: TIPOS_MATERIAIS_BASE,
        },
        {
            title: 'Tipo Material',
            href: TIPOS_MATERIAIS_BASE,
        },
    ] satisfies BreadcrumbItem[],
};
