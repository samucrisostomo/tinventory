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

const SITUACOES_COLABORADOR_BASE = '/situacoes-colaborador';

type SituacaoColaboradorListItem = {
    id: number;
    nome: string;
    descricao: string | null;
    ativo: boolean;
    created_at: string;
    updated_at: string;
};

type Props = {
    situacoesColaborador: SituacaoColaboradorListItem[];
};

export default function SituacaoColaboradorIndex({ situacoesColaborador }: Props) {
    const { flash } = usePage().props as {
        flash?: {
            success?: string;
            error?: string;
        };
    };

    const [sheetMode, setSheetMode] = useState<'create' | 'edit'>('create');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingSituacaoColaboradorId, setEditingSituacaoColaboradorId] = useState<
        number | null
    >(null);
    const [situacaoColaboradorToDelete, setSituacaoColaboradorToDelete] =
        useState<SituacaoColaboradorListItem | null>(null);

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
    });

    const openCreateSheet = () => {
        setSheetMode('create');
        setEditingSituacaoColaboradorId(null);
        form.reset();
        form.clearErrors();
        setSheetOpen(true);
    };

    const openEditSheet = (situacaoColaborador: SituacaoColaboradorListItem) => {
        setSheetMode('edit');
        setEditingSituacaoColaboradorId(situacaoColaborador.id);
        form.setData({
            nome: situacaoColaborador.nome,
            descricao: situacaoColaborador.descricao ?? '',
        });
        form.clearErrors();
        setSheetOpen(true);
    };

    const submitForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (sheetMode === 'create') {
            form.post(SITUACOES_COLABORADOR_BASE, {
                preserveScroll: true,
                onSuccess: () => {
                    form.reset();
                    setSheetOpen(false);
                },
            });

            return;
        }

        if (!editingSituacaoColaboradorId) {
            return;
        }

        form.patch(`${SITUACOES_COLABORADOR_BASE}/${editingSituacaoColaboradorId}`, {
            preserveScroll: true,
            onSuccess: () => setSheetOpen(false),
        });
    };

    const toggleSituacaoColaboradorStatus = (
        situacaoColaborador: SituacaoColaboradorListItem,
        checked: boolean,
    ) => {
        router.patch(
            `${SITUACOES_COLABORADOR_BASE}/${situacaoColaborador.id}/status`,
            {},
            {
                preserveScroll: true,
                onBefore: () => {
                    if (checked === situacaoColaborador.ativo) {
                        return false;
                    }
                },
            },
        );
    };

    const confirmDeleteSituacaoColaborador = () => {
        if (!situacaoColaboradorToDelete) {
            return;
        }

        router.delete(
            `${SITUACOES_COLABORADOR_BASE}/${situacaoColaboradorToDelete.id}`,
            {
                preserveScroll: true,
                onSuccess: () => setSituacaoColaboradorToDelete(null),
            },
        );
    };

    return (
        <>
            <Head title="Situação do Colaborador" />

            <div className="p-4">
                <div className="mb-4 flex items-center justify-between gap-2">
                    <h1 className="text-lg font-semibold">Situação do Colaborador</h1>
                    <Button onClick={openCreateSheet}>Nova situação</Button>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium">Nome</th>
                                <th className="px-4 py-3 font-medium">Descrição</th>
                                <th className="px-4 py-3 font-medium">Ativo</th>
                                <th className="px-4 py-3 font-medium">Criado em</th>
                                <th className="px-4 py-3 font-medium">Atualizado em</th>
                                <th className="px-4 py-3 font-medium">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {situacoesColaborador.map((situacaoColaborador) => (
                                <tr
                                    key={situacaoColaborador.id}
                                    className="border-t border-border"
                                >
                                    <td className="px-4 py-3">{situacaoColaborador.nome}</td>
                                    <td className="px-4 py-3">
                                        {situacaoColaborador.descricao || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Switch
                                            checked={situacaoColaborador.ativo}
                                            onCheckedChange={(checked) =>
                                                toggleSituacaoColaboradorStatus(
                                                    situacaoColaborador,
                                                    checked,
                                                )
                                            }
                                            aria-label={`Alternar status da situação ${situacaoColaborador.nome}`}
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        {new Date(
                                            situacaoColaborador.created_at,
                                        ).toLocaleString('pt-BR')}
                                    </td>
                                    <td className="px-4 py-3">
                                        {new Date(
                                            situacaoColaborador.updated_at,
                                        ).toLocaleString('pt-BR')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    aria-label={`Abrir ações de ${situacaoColaborador.nome}`}
                                                >
                                                    <EllipsisVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        openEditSheet(situacaoColaborador)
                                                    }
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() =>
                                                        setSituacaoColaboradorToDelete(
                                                            situacaoColaborador,
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
                                    ? 'Criar situação do colaborador'
                                    : 'Editar situação do colaborador'}
                            </SheetTitle>
                            <SheetDescription>
                                {sheetMode === 'create'
                                    ? 'Cadastre uma nova situação do colaborador.'
                                    : 'Atualize os dados da situação selecionada.'}
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
                open={Boolean(situacaoColaboradorToDelete)}
                onOpenChange={(open) => {
                    if (!open) {
                        setSituacaoColaboradorToDelete(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Tem certeza que deseja deletar esta situação do colaborador?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. A situação será removida do cadastro.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteSituacaoColaborador}
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

SituacaoColaboradorIndex.layout = {
    breadcrumbs: [
        {
            title: 'Cadastros',
            href: SITUACOES_COLABORADOR_BASE,
        },
        {
            title: 'Colaborador',
            href: SITUACOES_COLABORADOR_BASE,
        },
        {
            title: 'Situação do Colaborador',
            href: SITUACOES_COLABORADOR_BASE,
        },
    ] satisfies BreadcrumbItem[],
};
