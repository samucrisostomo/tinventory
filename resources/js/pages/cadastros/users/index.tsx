import { Head, router, useForm, usePage } from '@inertiajs/react';
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
import { EllipsisVertical, Pencil } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

type UserListItem = {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    created_at: string;
};

type Props = {
    users: UserListItem[];
};

export default function UsersIndex({ users }: Props) {
    const { flash } = usePage().props as {
        flash?: {
            success?: string;
            error?: string;
        };
    };
    const [sheetMode, setSheetMode] = useState<'create' | 'edit'>('create');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash?.success, flash?.error]);

    const form = useForm({
        name: '',
        email: '',
        password: '',
    });

    const openCreateSheet = () => {
        setSheetMode('create');
        setEditingUserId(null);
        form.reset();
        form.clearErrors();
        setSheetOpen(true);
    };

    const openEditSheet = (user: UserListItem) => {
        setSheetMode('edit');
        setEditingUserId(user.id);
        form.setData({
            name: user.name,
            email: user.email,
            password: '',
        });
        form.clearErrors();
        setSheetOpen(true);
    };

    const submitForm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (sheetMode === 'create') {
            form.post('/users', {
                preserveScroll: true,
                onSuccess: () => {
                    form.reset();
                    setSheetOpen(false);
                },
            });

            return;
        }

        if (!editingUserId) {
            return;
        }

        form.patch(`/users/${editingUserId}`, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('password');
                setSheetOpen(false);
            },
        });
    };

    const toggleUserStatus = (user: UserListItem, checked: boolean) => {
        router.patch(
            `/users/${user.id}/status`,
            {},
            {
                preserveScroll: true,
                onBefore: () => {
                    if (checked === user.is_active) {
                        return false;
                    }
                },
            },
        );
    };

    return (
        <>
            <Head title="Usuários" />

            <div className="p-4">
                <div className="mb-4 flex items-center justify-between gap-2">
                    <h1 className="text-lg font-semibold">Usuários</h1>
                    <Button onClick={openCreateSheet}>Novo usuário</Button>
                </div>

                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium">Nome</th>
                                <th className="px-4 py-3 font-medium">E-mail</th>
                                <th className="px-4 py-3 font-medium">Ativo</th>
                                <th className="px-4 py-3 font-medium">Criado em</th>
                                <th className="px-4 py-3 font-medium">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-t border-border">
                                    <td className="px-4 py-3">{user.name}</td>
                                    <td className="px-4 py-3">{user.email}</td>
                                    <td className="px-4 py-3">
                                        <Switch
                                            checked={user.is_active}
                                            onCheckedChange={(checked) =>
                                                toggleUserStatus(user, checked)
                                            }
                                            aria-label={`Alternar status do usuário ${user.name}`}
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        {new Date(user.created_at).toLocaleString(
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
                                                    aria-label={`Abrir ações de ${user.name}`}
                                                >
                                                    <EllipsisVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        openEditSheet(user)
                                                    }
                                                >
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Editar
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
                                    ? 'Criar usuário'
                                    : 'Editar usuário'}
                            </SheetTitle>
                            <SheetDescription>
                                {sheetMode === 'create'
                                    ? 'Preencha os dados para criar um novo usuário.'
                                    : 'Atualize os dados do usuário selecionado.'}
                            </SheetDescription>
                        </SheetHeader>

                        <div className="flex-1 space-y-4 px-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome</Label>
                                <Input
                                    id="name"
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                />
                                {form.errors.name && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.name}
                                    </p>
                                )}
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
                                <Label htmlFor="password">
                                    Senha{' '}
                                    {sheetMode === 'edit' ? '(opcional)' : ''}
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={form.data.password}
                                    onChange={(event) =>
                                        form.setData(
                                            'password',
                                            event.target.value,
                                        )
                                    }
                                />
                                {form.errors.password && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.password}
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
        </>
    );
}

UsersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Usuários',
            href: '/users',
        },
    ] satisfies BreadcrumbItem[],
};
