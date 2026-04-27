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

const ESTOQUES_BASE = '/operacoes-estoque/estoques';
const SELECT_VAZIO = '__none__';

type TipoEstoqueOption = {
    id: number;
    codigo: string;
    descricao: string | null;
};

type EmpresaOption = {
    id: number;
    nome: string;
};

type LocalOption = {
    id: number;
    nome: string;
    codigo: string;
    empresa_id: number;
};

type ColaboradorOption = {
    id: number;
    nome: string;
    empresa_id: number;
    local_id: number;
};

type EstoqueListItem = {
    id: number;
    nome: string;
    tipos_estoque_id: number;
    colaborador_id: number | null;
    empresa_id: number;
    local_id: number;
    tipo_estoque: { id: number; codigo: string; descricao: string | null };
    colaborador: { id: number; nome: string } | null;
    empresa: { id: number; nome: string };
    local: { id: number; nome: string; codigo: string };
    created_at: string;
};

type Props = {
    estoques: EstoqueListItem[];
    tiposEstoque: TipoEstoqueOption[];
    empresas: EmpresaOption[];
    locais: LocalOption[];
    colaboradores: ColaboradorOption[];
};

export default function EstoquesIndex({
    estoques,
    tiposEstoque,
    empresas,
    locais,
    colaboradores,
}: Props) {
    const { flash } = usePage().props as {
        flash?: {
            success?: string;
            error?: string;
        };
    };

    const [sheetMode, setSheetMode] = useState<'create' | 'edit'>('create');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingEstoqueId, setEditingEstoqueId] = useState<number | null>(null);
    const [estoqueToDelete, setEstoqueToDelete] = useState<EstoqueListItem | null>(null);

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
        tipos_estoque_id: '',
        colaborador_id: '',
        empresa_id: '',
        local_id: '',
    });

    const locaisFiltrados = useMemo(() => {
        if (form.data.empresa_id === '') {
            return [];
        }

        return locais.filter(
            (local) => String(local.empresa_id) === String(form.data.empresa_id),
        );
    }, [form.data.empresa_id, locais]);

    const colaboradoresFiltrados = useMemo(() => {
        if (form.data.empresa_id === '' || form.data.local_id === '') {
            return [];
        }

        return colaboradores.filter(
            (colaborador) =>
                String(colaborador.empresa_id) === String(form.data.empresa_id) &&
                String(colaborador.local_id) === String(form.data.local_id),
        );
    }, [colaboradores, form.data.empresa_id, form.data.local_id]);

    const openCreateSheet = () => {
        setSheetMode('create');
        setEditingEstoqueId(null);
        form.reset();
        form.clearErrors();
        setSheetOpen(true);
    };

    const openEditSheet = (estoque: EstoqueListItem) => {
        setSheetMode('edit');
        setEditingEstoqueId(estoque.id);
        form.setData({
            nome: estoque.nome,
            tipos_estoque_id: String(estoque.tipos_estoque_id),
            colaborador_id: estoque.colaborador_id ? String(estoque.colaborador_id) : '',
            empresa_id: String(estoque.empresa_id),
            local_id: String(estoque.local_id),
        });
        form.clearErrors();
        setSheetOpen(true);
    };

    const submitForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (sheetMode === 'create') {
            form.post(ESTOQUES_BASE, {
                preserveScroll: true,
                onSuccess: () => {
                    form.reset();
                    setSheetOpen(false);
                },
            });

            return;
        }

        if (!editingEstoqueId) {
            return;
        }

        form.patch(`${ESTOQUES_BASE}/${editingEstoqueId}`, {
            preserveScroll: true,
            onSuccess: () => setSheetOpen(false),
        });
    };

    const confirmDeleteEstoque = () => {
        if (!estoqueToDelete) {
            return;
        }

        router.delete(`${ESTOQUES_BASE}/${estoqueToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => setEstoqueToDelete(null),
        });
    };

    const onSelectChange = (
        key: 'tipos_estoque_id' | 'empresa_id' | 'local_id' | 'colaborador_id',
        value: string,
    ) => {
        const next = value === SELECT_VAZIO ? '' : value;

        if (key === 'empresa_id') {
            const allowedLocaisIds = new Set(
                locais
                    .filter((local) => String(local.empresa_id) === String(next))
                    .map((local) => String(local.id)),
            );
            const keepLocal =
                form.data.local_id !== '' && allowedLocaisIds.has(form.data.local_id);

            form.setData((previousData) => ({
                ...previousData,
                empresa_id: next,
                local_id: keepLocal ? previousData.local_id : '',
                colaborador_id: '',
            }));

            return;
        }

        if (key === 'local_id') {
            form.setData((previousData) => ({
                ...previousData,
                local_id: next,
                colaborador_id: '',
            }));

            return;
        }

        form.setData(key, next);
    };

    const selectValue = (field: string) => (field === '' ? SELECT_VAZIO : field);

    const tipoEstoqueLabel = (tipo: TipoEstoqueOption) =>
        tipo.descricao ? `${tipo.codigo} - ${tipo.descricao}` : tipo.codigo;

    return (
        <>
            <Head title="Estoques" />

            <div className="p-4">
                <div className="mb-4 flex items-center justify-between gap-2">
                    <h1 className="text-lg font-semibold">Estoques</h1>
                    <Button onClick={openCreateSheet}>Novo estoque</Button>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium">Código</th>
                                <th className="px-4 py-3 font-medium">Nome</th>
                                <th className="px-4 py-3 font-medium">Tipo</th>
                                <th className="px-4 py-3 font-medium">Colaborador</th>
                                <th className="px-4 py-3 font-medium">Empresa</th>
                                <th className="px-4 py-3 font-medium">Local</th>
                                <th className="px-4 py-3 font-medium">Criado em</th>
                                <th className="px-4 py-3 font-medium">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {estoques.map((estoque) => (
                                <tr key={estoque.id} className="border-t border-border">
                                    <td className="px-4 py-3">
                                        {estoque.colaborador?.id ?? '-'}
                                    </td>
                                    <td className="px-4 py-3">{estoque.nome}</td>
                                    <td className="px-4 py-3">
                                        {estoque.tipo_estoque
                                            ? tipoEstoqueLabel(estoque.tipo_estoque)
                                            : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {estoque.colaborador?.nome ?? '-'}
                                    </td>
                                    <td className="px-4 py-3">{estoque.empresa?.nome ?? '-'}</td>
                                    <td className="px-4 py-3">
                                        {estoque.local
                                            ? `${estoque.local.nome} (${estoque.local.codigo})`
                                            : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {new Date(estoque.created_at).toLocaleString('pt-BR')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    aria-label={`Abrir acoes de ${estoque.nome}`}
                                                >
                                                    <EllipsisVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => openEditSheet(estoque)}
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => setEstoqueToDelete(estoque)}
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
                                {sheetMode === 'create' ? 'Novo estoque' : 'Editar estoque'}
                            </SheetTitle>
                            <SheetDescription>
                                Cadastre ou atualize os dados do estoque.
                            </SheetDescription>
                        </SheetHeader>

                        <div className="flex-1 space-y-4 px-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="nome">Nome do estoque *</Label>
                                <Input
                                    id="nome"
                                    value={form.data.nome}
                                    onChange={(event) =>
                                        form.setData('nome', event.target.value)
                                    }
                                />
                                {form.errors.nome && (
                                    <p className="text-xs text-destructive">{form.errors.nome}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tipos_estoque_id">Tipo de estoque *</Label>
                                <Select
                                    value={selectValue(form.data.tipos_estoque_id)}
                                    onValueChange={(value) =>
                                        onSelectChange('tipos_estoque_id', value)
                                    }
                                >
                                    <SelectTrigger id="tipos_estoque_id" className="w-full">
                                        <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                        <SelectItem value={SELECT_VAZIO} disabled>
                                            Selecione o tipo
                                        </SelectItem>
                                        {tiposEstoque.map((tipo) => (
                                            <SelectItem key={tipo.id} value={String(tipo.id)}>
                                                {tipoEstoqueLabel(tipo)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.tipos_estoque_id && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.tipos_estoque_id}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="empresa_id">Empresa *</Label>
                                <Select
                                    value={selectValue(form.data.empresa_id)}
                                    onValueChange={(value) => onSelectChange('empresa_id', value)}
                                >
                                    <SelectTrigger id="empresa_id" className="w-full">
                                        <SelectValue placeholder="Selecione a empresa" />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                        <SelectItem value={SELECT_VAZIO} disabled>
                                            Selecione a empresa
                                        </SelectItem>
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
                                <Label htmlFor="local_id">Local *</Label>
                                <Select
                                    value={selectValue(form.data.local_id)}
                                    onValueChange={(value) => onSelectChange('local_id', value)}
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
                                        {locaisFiltrados.map((local) => (
                                            <SelectItem key={local.id} value={String(local.id)}>
                                                {local.nome} ({local.codigo})
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

                            <div className="space-y-2">
                                <Label htmlFor="colaborador_id">Colaborador</Label>
                                <Select
                                    value={selectValue(form.data.colaborador_id)}
                                    onValueChange={(value) =>
                                        onSelectChange('colaborador_id', value)
                                    }
                                    disabled={
                                        form.data.empresa_id === '' || form.data.local_id === ''
                                    }
                                >
                                    <SelectTrigger id="colaborador_id" className="w-full">
                                        <SelectValue
                                            placeholder={
                                                form.data.empresa_id === '' ||
                                                form.data.local_id === ''
                                                    ? 'Selecione empresa e local primeiro'
                                                    : 'Selecione o colaborador (opcional)'
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                        <SelectItem value={SELECT_VAZIO}>
                                            Nenhum colaborador
                                        </SelectItem>
                                        {colaboradoresFiltrados.map((colaborador) => (
                                            <SelectItem
                                                key={colaborador.id}
                                                value={String(colaborador.id)}
                                            >
                                                {colaborador.id} - {colaborador.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.colaborador_id && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.colaborador_id}
                                    </p>
                                )}
                            </div>
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
                open={Boolean(estoqueToDelete)}
                onOpenChange={(open) => {
                    if (!open) {
                        setEstoqueToDelete(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir estoque?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acao nao pode ser desfeita. O estoque sera removido do cadastro.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteEstoque}
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

EstoquesIndex.layout = {
    breadcrumbs: [
        { title: 'Operacoes', href: ESTOQUES_BASE },
        { title: 'Estoque', href: ESTOQUES_BASE },
        { title: 'Estoques', href: ESTOQUES_BASE },
    ] satisfies BreadcrumbItem[],
};
