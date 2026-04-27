import { Head, router, useForm, usePage } from '@inertiajs/react';
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
import type { BreadcrumbItem } from '@/types';
import {
    COLABORADOR_FORMULARIO_CAMPOS,
    COLABORADOR_FORMULARIO_LABELS,
    type ColaboradorFormularioCampo,
    mergeColaboradorFormularioSchema,
} from '@/lib/colaborador-formulario';

const COLABORADORES_BASE = '/colaboradores';

const SELECT_VAZIO = '__none__';

const normalizeDateForInput = (value: string | null) => {
    if (!value) {
        return '';
    }

    const dateOnly = value.split('T')[0];
    return /^\d{4}-\d{2}-\d{2}$/.test(dateOnly) ? dateOnly : '';
};

const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);

    if (digits.length <= 3) {
        return digits;
    }

    if (digits.length <= 6) {
        return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    }

    if (digits.length <= 9) {
        return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    }

    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const formatDatePtBr = (value: string | null) => {
    if (!value) {
        return '-';
    }

    const normalized = normalizeDateForInput(value);
    if (!normalized) {
        return '-';
    }

    return new Date(`${normalized}T00:00:00`).toLocaleDateString('pt-BR');
};

type Option = {
    id: number;
    nome: string;
};

type TipoColaboradorOption = {
    id: number;
    nome: string;
    configuracao_formulario: unknown | null;
};

type LocalOption = {
    id: number;
    nome: string;
    codigo: string;
    empresa_id: number;
};

type ColaboradorListItem = {
    id: number;
    nome: string;
    tipo_colaborador_id: number;
    matricula: string | null;
    cpf: string | null;
    empresa_id: number | null;
    local_id: number | null;
    data_admissao: string | null;
    data_afastamento: string | null;
    situacao_id: number | null;
    tipo_colaborador: { id: number; nome: string };
    empresa: { id: number; nome: string };
    local: { id: number; nome: string; codigo: string };
    situacao_colaborador: { id: number; nome: string };
    created_at: string;
};

type Props = {
    colaboradores: ColaboradorListItem[];
    tiposColaborador: TipoColaboradorOption[];
    situacoesColaborador: Option[];
    empresas: Option[];
    locais: LocalOption[];
};

export default function ColaboradoresIndex({
    colaboradores,
    tiposColaborador,
    situacoesColaborador,
    empresas,
    locais,
}: Props) {
    const { flash } = usePage().props as {
        flash?: {
            success?: string;
            error?: string;
        };
    };

    const [sheetMode, setSheetMode] = useState<'create' | 'edit'>('create');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingColaboradorId, setEditingColaboradorId] = useState<number | null>(null);
    const [colaboradorToDelete, setColaboradorToDelete] = useState<ColaboradorListItem | null>(
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
        nome: '',
        tipo_colaborador_id: '',
        matricula: '',
        cpf: '',
        empresa_id: '',
        local_id: '',
        data_admissao: '',
        data_afastamento: '',
        situacao_id: '',
    });

    const locaisFiltrados = useMemo(() => {
        if (form.data.empresa_id === '') {
            return [];
        }

        return locais.filter(
            (local) => String(local.empresa_id) === String(form.data.empresa_id),
        );
    }, [form.data.empresa_id, locais]);

    const selectedTipoColaborador = useMemo(() => {
        if (form.data.tipo_colaborador_id === '') {
            return undefined;
        }

        return tiposColaborador.find(
            (t) => String(t.id) === String(form.data.tipo_colaborador_id),
        );
    }, [form.data.tipo_colaborador_id, tiposColaborador]);

    const formularioSchema = useMemo(
        () => mergeColaboradorFormularioSchema(selectedTipoColaborador?.configuracao_formulario),
        [selectedTipoColaborador],
    );

    const isCampoVisivel = (campo: ColaboradorFormularioCampo) => {
        if (form.data.tipo_colaborador_id === '') {
            return false;
        }

        return formularioSchema[campo]?.visible ?? false;
    };

    const isCampoObrigatorio = (campo: ColaboradorFormularioCampo) => {
        if (form.data.tipo_colaborador_id === '') {
            return false;
        }

        return formularioSchema[campo]?.required ?? false;
    };

    useEffect(() => {
        if (form.data.tipo_colaborador_id === '') {
            return;
        }

        const tipo = tiposColaborador.find(
            (t) => String(t.id) === String(form.data.tipo_colaborador_id),
        );
        const schema = mergeColaboradorFormularioSchema(tipo?.configuracao_formulario);

        form.setData((previous) => {
            const next = { ...previous };
            for (const campo of COLABORADOR_FORMULARIO_CAMPOS) {
                if (!schema[campo].visible) {
                    if (campo === 'data_afastamento') {
                        next.data_afastamento = '';
                    } else {
                        (next as Record<string, string>)[campo] = '';
                    }
                }
            }

            return next;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- apenas ao mudar o tipo
    }, [form.data.tipo_colaborador_id, tiposColaborador]);

    const openCreateSheet = () => {
        setSheetMode('create');
        setEditingColaboradorId(null);
        form.reset();
        form.clearErrors();
        setSheetOpen(true);
    };

    const openEditSheet = (colaborador: ColaboradorListItem) => {
        setSheetMode('edit');
        setEditingColaboradorId(colaborador.id);
        form.setData({
            nome: colaborador.nome,
            tipo_colaborador_id: String(colaborador.tipo_colaborador_id),
            matricula: colaborador.matricula ?? '',
            cpf: formatCpf(colaborador.cpf ?? ''),
            empresa_id:
                colaborador.empresa_id != null ? String(colaborador.empresa_id) : '',
            local_id: colaborador.local_id != null ? String(colaborador.local_id) : '',
            data_admissao: normalizeDateForInput(colaborador.data_admissao),
            data_afastamento: normalizeDateForInput(colaborador.data_afastamento),
            situacao_id:
                colaborador.situacao_id != null ? String(colaborador.situacao_id) : '',
        });
        form.clearErrors();
        setSheetOpen(true);
    };

    const submitForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (sheetMode === 'create') {
            form.post(COLABORADORES_BASE, {
                preserveScroll: true,
                onSuccess: () => {
                    form.reset();
                    setSheetOpen(false);
                },
            });

            return;
        }

        if (!editingColaboradorId) {
            return;
        }

        form.patch(`${COLABORADORES_BASE}/${editingColaboradorId}`, {
            preserveScroll: true,
            onSuccess: () => setSheetOpen(false),
        });
    };

    const confirmDeleteColaborador = () => {
        if (!colaboradorToDelete) {
            return;
        }

        router.delete(`${COLABORADORES_BASE}/${colaboradorToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => setColaboradorToDelete(null),
        });
    };

    const selectValue = (field: string) => {
        return field === '' ? SELECT_VAZIO : field;
    };

    const onSelectChange = (
        key: 'tipo_colaborador_id' | 'empresa_id' | 'local_id' | 'situacao_id',
        value: string,
    ) => {
        const next = value === SELECT_VAZIO ? '' : value;

        if (key === 'empresa_id') {
            const allowedIds = new Set(
                locais
                    .filter((l) => String(l.empresa_id) === String(next))
                    .map((l) => String(l.id)),
            );
            const keepLocal =
                form.data.local_id !== '' && allowedIds.has(form.data.local_id);
            form.setData((previousData) => ({
                ...previousData,
                empresa_id: next,
                local_id: keepLocal ? previousData.local_id : '',
            }));

            return;
        }

        form.setData(key, next);
    };

    return (
        <>
            <Head title="Colaboradores" />

            <div className="p-4">
                <div className="mb-4 flex items-center justify-between gap-2">
                    <h1 className="text-lg font-semibold">Colaboradores</h1>
                    <Button onClick={openCreateSheet}>Novo colaborador</Button>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium">Nome</th>
                                <th className="px-4 py-3 font-medium">Tipo</th>
                                <th className="px-4 py-3 font-medium">Matrícula</th>
                                <th className="px-4 py-3 font-medium">CPF</th>
                                <th className="px-4 py-3 font-medium">Empresa</th>
                                <th className="px-4 py-3 font-medium">Local</th>
                                <th className="px-4 py-3 font-medium">Admissão</th>
                                <th className="px-4 py-3 font-medium">Afastamento</th>
                                <th className="px-4 py-3 font-medium">Situação</th>
                                <th className="px-4 py-3 font-medium">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {colaboradores.map((colaborador) => (
                                <tr key={colaborador.id} className="border-t border-border">
                                    <td className="px-4 py-3">{colaborador.nome}</td>
                                    <td className="px-4 py-3">
                                        {colaborador.tipo_colaborador?.nome ?? '-'}
                                    </td>
                                    <td className="px-4 py-3">{colaborador.matricula ?? '-'}</td>
                                    <td className="px-4 py-3">
                                        {colaborador.cpf ? formatCpf(colaborador.cpf) : '-'}
                                    </td>
                                    <td className="px-4 py-3">{colaborador.empresa?.nome ?? '-'}</td>
                                    <td className="px-4 py-3">{colaborador.local?.nome ?? '-'}</td>
                                    <td className="px-4 py-3">
                                        {formatDatePtBr(colaborador.data_admissao)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {formatDatePtBr(colaborador.data_afastamento)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {colaborador.situacao_colaborador?.nome ?? '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    aria-label={`Abrir ações de ${colaborador.nome}`}
                                                >
                                                    <EllipsisVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => openEditSheet(colaborador)}
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => setColaboradorToDelete(colaborador)}
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
                <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
                    <form onSubmit={submitForm} className="flex min-h-full flex-col">
                        <SheetHeader>
                            <SheetTitle>
                                {sheetMode === 'create' ? 'Novo colaborador' : 'Editar colaborador'}
                            </SheetTitle>
                            <SheetDescription>
                                Os campos exibidos dependem do tipo de colaborador. CPF é salvo
                                apenas com números (11 dígitos), quando informado.
                            </SheetDescription>
                        </SheetHeader>

                        <div className="flex-1 space-y-4 px-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="tipo_colaborador_id">Tipo de colaborador *</Label>
                                <Select
                                    value={selectValue(form.data.tipo_colaborador_id)}
                                    onValueChange={(v) => onSelectChange('tipo_colaborador_id', v)}
                                >
                                    <SelectTrigger id="tipo_colaborador_id" className="w-full">
                                        <SelectValue placeholder="Selecione o tipo primeiro" />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                        <SelectItem value={SELECT_VAZIO} disabled>
                                            Selecione o tipo
                                        </SelectItem>
                                        {tiposColaborador.map((t) => (
                                            <SelectItem key={t.id} value={String(t.id)}>
                                                {t.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.tipo_colaborador_id && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.tipo_colaborador_id}
                                    </p>
                                )}
                            </div>

                            {form.data.tipo_colaborador_id === '' && (
                                <p className="text-sm text-muted-foreground">
                                    Selecione o tipo de colaborador para exibir os campos do
                                    formulário.
                                </p>
                            )}

                            {isCampoVisivel('nome') && (
                                <div className="space-y-2">
                                    <Label htmlFor="nome">
                                        {COLABORADOR_FORMULARIO_LABELS.nome}
                                        {isCampoObrigatorio('nome') ? ' *' : ''}
                                    </Label>
                                    <Input
                                        id="nome"
                                        value={form.data.nome}
                                        onChange={(e) => form.setData('nome', e.target.value)}
                                    />
                                    {form.errors.nome && (
                                        <p className="text-xs text-destructive">{form.errors.nome}</p>
                                    )}
                                </div>
                            )}

                            {isCampoVisivel('matricula') && (
                                <div className="space-y-2">
                                    <Label htmlFor="matricula">
                                        {COLABORADOR_FORMULARIO_LABELS.matricula}
                                        {isCampoObrigatorio('matricula') ? ' *' : ''}
                                    </Label>
                                    <Input
                                        id="matricula"
                                        value={form.data.matricula}
                                        onChange={(e) => form.setData('matricula', e.target.value)}
                                    />
                                    {form.errors.matricula && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.matricula}
                                        </p>
                                    )}
                                </div>
                            )}

                            {isCampoVisivel('cpf') && (
                                <div className="space-y-2">
                                    <Label htmlFor="cpf">
                                        {COLABORADOR_FORMULARIO_LABELS.cpf}
                                        {isCampoObrigatorio('cpf') ? ' *' : ''}
                                    </Label>
                                    <Input
                                        id="cpf"
                                        inputMode="numeric"
                                        autoComplete="off"
                                        value={form.data.cpf}
                                        onChange={(e) =>
                                            form.setData('cpf', formatCpf(e.target.value))
                                        }
                                        placeholder="000.000.000-00"
                                    />
                                    {form.errors.cpf && (
                                        <p className="text-xs text-destructive">{form.errors.cpf}</p>
                                    )}
                                </div>
                            )}

                            {isCampoVisivel('empresa_id') && (
                                <div className="space-y-2">
                                    <Label htmlFor="empresa_id">
                                        {COLABORADOR_FORMULARIO_LABELS.empresa_id}
                                        {isCampoObrigatorio('empresa_id') ? ' *' : ''}
                                    </Label>
                                    <Select
                                        value={selectValue(form.data.empresa_id)}
                                        onValueChange={(v) => onSelectChange('empresa_id', v)}
                                    >
                                        <SelectTrigger id="empresa_id" className="w-full">
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent position="popper">
                                            <SelectItem value={SELECT_VAZIO} disabled>
                                                Selecione a empresa
                                            </SelectItem>
                                            {empresas.map((e) => (
                                                <SelectItem key={e.id} value={String(e.id)}>
                                                    {e.nome}
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
                            )}

                            {isCampoVisivel('local_id') && (
                                <div className="space-y-2">
                                    <Label htmlFor="local_id">
                                        {COLABORADOR_FORMULARIO_LABELS.local_id}
                                        {isCampoObrigatorio('local_id') ? ' *' : ''}
                                    </Label>
                                    <Select
                                        value={selectValue(form.data.local_id)}
                                        onValueChange={(v) => onSelectChange('local_id', v)}
                                        disabled={form.data.empresa_id === ''}
                                    >
                                        <SelectTrigger id="local_id" className="w-full">
                                            <SelectValue
                                                placeholder={
                                                    form.data.empresa_id === ''
                                                        ? 'Selecione a empresa primeiro'
                                                        : 'Selecione o local'
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent position="popper">
                                            <SelectItem value={SELECT_VAZIO} disabled>
                                                Selecione o local
                                            </SelectItem>
                                            {locaisFiltrados.map((l) => (
                                                <SelectItem key={l.id} value={String(l.id)}>
                                                    {l.nome} ({l.codigo})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.errors.local_id && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.local_id}
                                        </p>
                                    )}
                                </div>
                            )}

                            {isCampoVisivel('data_admissao') && (
                                <div className="space-y-2">
                                    <Label htmlFor="data_admissao">
                                        {COLABORADOR_FORMULARIO_LABELS.data_admissao}
                                        {isCampoObrigatorio('data_admissao') ? ' *' : ''}
                                    </Label>
                                    <Input
                                        id="data_admissao"
                                        type="date"
                                        value={form.data.data_admissao}
                                        onChange={(e) =>
                                            form.setData('data_admissao', e.target.value)
                                        }
                                    />
                                    {form.errors.data_admissao && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.data_admissao}
                                        </p>
                                    )}
                                </div>
                            )}

                            {isCampoVisivel('data_afastamento') && (
                                <div className="space-y-2">
                                    <Label htmlFor="data_afastamento">
                                        {COLABORADOR_FORMULARIO_LABELS.data_afastamento}
                                        {isCampoObrigatorio('data_afastamento') ? ' *' : ''}
                                    </Label>
                                    <Input
                                        id="data_afastamento"
                                        type="date"
                                        value={form.data.data_afastamento}
                                        onChange={(e) =>
                                            form.setData('data_afastamento', e.target.value)
                                        }
                                    />
                                    {form.errors.data_afastamento && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.data_afastamento}
                                        </p>
                                    )}
                                </div>
                            )}

                            {isCampoVisivel('situacao_id') && (
                                <div className="space-y-2">
                                    <Label htmlFor="situacao_id">
                                        {COLABORADOR_FORMULARIO_LABELS.situacao_id}
                                        {isCampoObrigatorio('situacao_id') ? ' *' : ''}
                                    </Label>
                                    <Select
                                        value={selectValue(form.data.situacao_id)}
                                        onValueChange={(v) => onSelectChange('situacao_id', v)}
                                    >
                                        <SelectTrigger id="situacao_id" className="w-full">
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent position="popper">
                                            <SelectItem value={SELECT_VAZIO} disabled>
                                                Selecione a situação
                                            </SelectItem>
                                            {situacoesColaborador.map((s) => (
                                                <SelectItem key={s.id} value={String(s.id)}>
                                                    {s.nome}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.errors.situacao_id && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.situacao_id}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <SheetFooter className="flex-row items-center justify-end gap-2 border-t pt-4">
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
                open={Boolean(colaboradorToDelete)}
                onOpenChange={(open) => {
                    if (!open) {
                        setColaboradorToDelete(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir colaborador?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O colaborador será removido do cadastro.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteColaborador}
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

ColaboradoresIndex.layout = {
    breadcrumbs: [
        { title: 'Cadastros', href: COLABORADORES_BASE },
        { title: 'Colaborador', href: COLABORADORES_BASE },
        { title: 'Colaboradores', href: COLABORADORES_BASE },
    ] satisfies BreadcrumbItem[],
};
