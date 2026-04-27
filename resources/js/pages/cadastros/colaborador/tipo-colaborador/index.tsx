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
import { Checkbox } from '@/components/ui/checkbox';
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
import {
    COLABORADOR_FORMULARIO_CAMPOS,
    COLABORADOR_FORMULARIO_LABELS,
    type ColaboradorFormularioCampo,
    type ColaboradorFormularioSchema,
    defaultColaboradorFormularioSchema,
    mergeColaboradorFormularioSchema,
} from '@/lib/colaborador-formulario';

const TIPOS_COLABORADOR_BASE = '/tipos-colaborador';

type TipoColaboradorListItem = {
    id: number;
    nome: string;
    descricao: string | null;
    configuracao_formulario: unknown | null;
    ativo: boolean;
    created_at: string;
    updated_at: string;
};

type Props = {
    tiposColaborador: TipoColaboradorListItem[];
};

export default function TipoColaboradorIndex({ tiposColaborador }: Props) {
    const { flash } = usePage().props as {
        flash?: {
            success?: string;
            error?: string;
        };
    };

    const [sheetMode, setSheetMode] = useState<'create' | 'edit'>('create');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingTipoColaboradorId, setEditingTipoColaboradorId] = useState<
        number | null
    >(null);
    const [tipoColaboradorToDelete, setTipoColaboradorToDelete] =
        useState<TipoColaboradorListItem | null>(null);

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
        configuracao_formulario: defaultColaboradorFormularioSchema(),
    });

    const openCreateSheet = () => {
        setSheetMode('create');
        setEditingTipoColaboradorId(null);
        form.reset();
        form.clearErrors();
        setSheetOpen(true);
    };

    const openEditSheet = (tipoColaborador: TipoColaboradorListItem) => {
        setSheetMode('edit');
        setEditingTipoColaboradorId(tipoColaborador.id);
        form.setData({
            nome: tipoColaborador.nome,
            descricao: tipoColaborador.descricao ?? '',
            configuracao_formulario: mergeColaboradorFormularioSchema(
                tipoColaborador.configuracao_formulario,
            ),
        });
        form.clearErrors();
        setSheetOpen(true);
    };

    const submitForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (sheetMode === 'create') {
            form.post(TIPOS_COLABORADOR_BASE, {
                preserveScroll: true,
                onSuccess: () => {
                    form.reset();
                    setSheetOpen(false);
                },
            });

            return;
        }

        if (!editingTipoColaboradorId) {
            return;
        }

        form.patch(`${TIPOS_COLABORADOR_BASE}/${editingTipoColaboradorId}`, {
            preserveScroll: true,
            onSuccess: () => setSheetOpen(false),
        });
    };

    const toggleTipoColaboradorStatus = (
        tipoColaborador: TipoColaboradorListItem,
        checked: boolean,
    ) => {
        router.patch(
            `${TIPOS_COLABORADOR_BASE}/${tipoColaborador.id}/status`,
            {},
            {
                preserveScroll: true,
                onBefore: () => {
                    if (checked === tipoColaborador.ativo) {
                        return false;
                    }
                },
            },
        );
    };

    const setFormularioCampo = (
        campo: ColaboradorFormularioCampo,
        patch: Partial<{ visible: boolean; required: boolean }>,
    ) => {
        const atual = form.data.configuracao_formulario[campo];
        let visible = patch.visible ?? atual.visible;
        let required = patch.required ?? atual.required;
        if (campo === 'nome') {
            visible = true;
            required = true;
        } else {
            if (!visible) {
                required = false;
            }
            if (required) {
                visible = true;
            }
        }
        form.setData('configuracao_formulario', {
            ...form.data.configuracao_formulario,
            [campo]: { visible, required },
        });
    };

    const confirmDeleteTipoColaborador = () => {
        if (!tipoColaboradorToDelete) {
            return;
        }

        router.delete(`${TIPOS_COLABORADOR_BASE}/${tipoColaboradorToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => setTipoColaboradorToDelete(null),
        });
    };

    return (
        <>
            <Head title="Tipo Colaborador" />

            <div className="p-4">
                <div className="mb-4 flex items-center justify-between gap-2">
                    <h1 className="text-lg font-semibold">Tipo Colaborador</h1>
                    <Button onClick={openCreateSheet}>Novo tipo colaborador</Button>
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
                            {tiposColaborador.map((tipoColaborador) => (
                                <tr
                                    key={tipoColaborador.id}
                                    className="border-t border-border"
                                >
                                    <td className="px-4 py-3">{tipoColaborador.nome}</td>
                                    <td className="px-4 py-3">
                                        {tipoColaborador.descricao || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Switch
                                            checked={tipoColaborador.ativo}
                                            onCheckedChange={(checked) =>
                                                toggleTipoColaboradorStatus(
                                                    tipoColaborador,
                                                    checked,
                                                )
                                            }
                                            aria-label={`Alternar status do tipo de colaborador ${tipoColaborador.nome}`}
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        {new Date(tipoColaborador.created_at).toLocaleString(
                                            'pt-BR',
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {new Date(tipoColaborador.updated_at).toLocaleString(
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
                                                    aria-label={`Abrir ações de ${tipoColaborador.nome}`}
                                                >
                                                    <EllipsisVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        openEditSheet(tipoColaborador)
                                                    }
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() =>
                                                        setTipoColaboradorToDelete(
                                                            tipoColaborador,
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
                                    ? 'Criar tipo colaborador'
                                    : 'Editar tipo colaborador'}
                            </SheetTitle>
                            <SheetDescription>
                                {sheetMode === 'create'
                                    ? 'Cadastre um novo tipo de colaborador.'
                                    : 'Atualize os dados do tipo de colaborador selecionado.'}
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

                            <div className="space-y-3 rounded-md border border-border p-3">
                                <p className="text-sm font-medium">
                                    Formulário de colaboradores (criar / editar)
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Defina quais campos aparecem e quais são obrigatórios. O nome
                                    permanece sempre visível e obrigatório.
                                </p>
                                <div className="space-y-2">
                                    {COLABORADOR_FORMULARIO_CAMPOS.map((campo) => {
                                        const cfg = form.data.configuracao_formulario[campo];
                                        const isNome = campo === 'nome';

                                        return (
                                            <div
                                                key={campo}
                                                className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 py-2 last:border-0"
                                            >
                                                <span className="text-sm font-medium">
                                                    {COLABORADOR_FORMULARIO_LABELS[campo]}
                                                </span>
                                                <div className="flex items-center gap-4">
                                                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                                                        <Checkbox
                                                            checked={cfg.visible}
                                                            disabled={isNome}
                                                            onCheckedChange={(v) =>
                                                                setFormularioCampo(campo, {
                                                                    visible: v === true,
                                                                })
                                                            }
                                                        />
                                                        Visível
                                                    </label>
                                                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                                                        <Checkbox
                                                            checked={cfg.required}
                                                            disabled={isNome || !cfg.visible}
                                                            onCheckedChange={(v) =>
                                                                setFormularioCampo(campo, {
                                                                    required: v === true,
                                                                })
                                                            }
                                                        />
                                                        Obrigatório
                                                    </label>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {form.errors.configuracao_formulario && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.configuracao_formulario}
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
                open={Boolean(tipoColaboradorToDelete)}
                onOpenChange={(open) => {
                    if (!open) {
                        setTipoColaboradorToDelete(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Tem certeza que deseja deletar este tipo de colaborador?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O tipo de colaborador será removido do
                            cadastro.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteTipoColaborador}
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

TipoColaboradorIndex.layout = {
    breadcrumbs: [
        {
            title: 'Cadastros',
            href: TIPOS_COLABORADOR_BASE,
        },
        {
            title: 'Colaborador',
            href: TIPOS_COLABORADOR_BASE,
        },
        {
            title: 'Tipo Colaborador',
            href: TIPOS_COLABORADOR_BASE,
        },
    ] satisfies BreadcrumbItem[],
};
