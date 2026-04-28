import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, Menu, Search } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import AppLogoIcon from '@/components/app-logo-icon';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuLink,
    NavigationMenuItem,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { UserMenuContent } from '@/components/user-menu-content';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, NavItem, User } from '@/types';

type Props = {
    breadcrumbs?: BreadcrumbItem[];
};

const activeItemStyles =
    'bg-muted text-foreground dark:bg-muted/90 dark:text-foreground';

export function AppHeader({ breadcrumbs = [] }: Props) {
    const page = usePage();
    const { auth } = page.props as unknown as {
        auth: {
            user: User;
        };
    };
    const getInitials = useInitials();
    const { isCurrentUrl, isCurrentOrParentUrl, whenCurrentUrl } = useCurrentUrl();
    const dashboardUrl = dashboard();

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboardUrl,
            icon: LayoutGrid,
        },
    ];

    const cadastrosNavItems: NavItem[] = [
        {
            title: 'Locais',
            href: '/locais',
        },
        {
            title: 'Perfis',
            href: '/perfis',
        },
        {
            title: 'Usuários',
            href: '/users',
        },
        {
            title: 'Empresas',
            href: '/empresas',
        },
        {
            title: 'Fornecedores',
            href: '/fornecedores',
        },
        {
            title: 'Tipo Colaborador',
            href: '/tipos-colaborador',
        },
        {
            title: 'Situação do Colaborador',
            href: '/situacoes-colaborador',
        },
        {
            title: 'Colaboradores',
            href: '/colaboradores',
        },
    ];

    const configuracoesEstoqueNavItems: NavItem[] = [
        {
            title: 'Tipo Material',
            href: '/config-estoque/tipos-materiais',
        },
        {
            title: 'Marcas',
            href: '/config-estoque/marcas',
        },
        {
            title: 'Tipo Estoque',
            href: '/config-estoque/tipos-estoque',
        },
    ];

    const operacoesEstoqueNavItems: NavItem[] = [
        {
            title: 'Estoques',
            href: '/operacoes-estoque/estoques',
        },
        {
            title: 'Entradas em lote',
            href: '/operacoes-estoque/entradas-lote',
        },
    ];

    return (
        <>
            <div className="border-b border-sidebar-border/80">
                <div className="flex h-16 w-full items-center px-4">
                    {/* Mobile Menu */}
                    <div className="lg:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="mr-2 h-[34px] w-[34px]"
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="left"
                                className="flex h-full w-64 flex-col items-stretch justify-between bg-sidebar"
                            >
                                <SheetTitle className="sr-only">
                                    Navigation menu
                                </SheetTitle>
                                <SheetHeader className="flex justify-start text-left">
                                    <AppLogoIcon className="h-6 w-6 fill-current text-black dark:text-white" />
                                </SheetHeader>
                                <div className="flex h-full flex-1 flex-col space-y-4 p-4">
                                    <div className="flex h-full flex-col justify-between text-sm">
                                        <div className="flex flex-col space-y-4">
                                            {mainNavItems.map((item) => (
                                                <Link
                                                    key={item.title}
                                                    href={item.href}
                                                    className="flex items-center space-x-2 font-medium"
                                                >
                                                    {item.icon && (
                                                        <item.icon className="h-5 w-5" />
                                                    )}
                                                    <span>{item.title}</span>
                                                </Link>
                                            ))}
                                            <div className="space-y-2">
                                                <p className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                    Cadastros
                                                </p>
                                                <div className="flex flex-col space-y-3">
                                                    {cadastrosNavItems.map(
                                                        (item) => (
                                                            <Link
                                                                key={item.title}
                                                                href={item.href}
                                                                className="flex items-center space-x-2 pl-1 font-medium"
                                                            >
                                                                <span>
                                                                    {item.title}
                                                                </span>
                                                            </Link>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                    Configurações de Estoque
                                                </p>
                                                <div className="flex flex-col space-y-3">
                                                    {configuracoesEstoqueNavItems.map(
                                                        (item) => (
                                                            <Link
                                                                key={item.title}
                                                                href={item.href}
                                                                className="flex items-center space-x-2 pl-1 font-medium"
                                                            >
                                                                <span>
                                                                    {item.title}
                                                                </span>
                                                            </Link>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                    Operações de Estoque
                                                </p>
                                                <div className="flex flex-col space-y-3">
                                                    {operacoesEstoqueNavItems.map((item) => (
                                                        <Link
                                                            key={item.title}
                                                            href={item.href}
                                                            className="flex items-center space-x-2 pl-1 font-medium"
                                                        >
                                                            <span>{item.title}</span>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <Link
                        href={dashboardUrl}
                        prefetch
                        className="flex items-center space-x-2"
                    >
                        <AppLogo />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden h-full flex-1 items-center justify-center px-6 lg:flex">
                        <NavigationMenu viewport={false} className="flex h-full items-stretch">
                            <NavigationMenuList className="flex h-full items-stretch space-x-2">
                                {mainNavItems.map((item, index) => (
                                    <NavigationMenuItem
                                        key={index}
                                        className="relative flex h-full items-center"
                                    >
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                navigationMenuTriggerStyle(),
                                                whenCurrentUrl(
                                                    item.href,
                                                    activeItemStyles,
                                                ),
                                                'h-9 cursor-pointer px-3',
                                            )}
                                        >
                                            {item.icon && (
                                                <item.icon className="mr-2 h-4 w-4" />
                                            )}
                                            {item.title}
                                        </Link>
                                        {isCurrentUrl(item.href) && (
                                            <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-primary"></div>
                                        )}
                                    </NavigationMenuItem>
                                ))}
                                <NavigationMenuItem className="relative flex h-full items-center">
                                    <NavigationMenuTrigger
                                        className={cn(
                                            whenCurrentUrl(
                                                '/locais',
                                                activeItemStyles,
                                            ) ||
                                                whenCurrentUrl(
                                                '/perfis',
                                                activeItemStyles,
                                            ) ||
                                                whenCurrentUrl(
                                                '/users',
                                                activeItemStyles,
                                            ) ||
                                                whenCurrentUrl(
                                                    '/empresas',
                                                    activeItemStyles,
                                                ) ||
                                                whenCurrentUrl(
                                                    '/fornecedores',
                                                    activeItemStyles,
                                                ) ||
                                                whenCurrentUrl(
                                                    '/tipos-colaborador',
                                                    activeItemStyles,
                                                ) ||
                                                whenCurrentUrl(
                                                    '/situacoes-colaborador',
                                                    activeItemStyles,
                                                ) ||
                                                whenCurrentUrl(
                                                    '/colaboradores',
                                                    activeItemStyles,
                                                ),
                                            'h-9 cursor-pointer px-3',
                                        )}
                                    >
                                        Cadastros
                                    </NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <ul className="grid w-[220px] gap-1 p-2">
                                            {cadastrosNavItems.map((item) => (
                                                <li key={item.title}>
                                                    <NavigationMenuLink asChild>
                                                        <Link
                                                            href={item.href}
                                                            className={cn(
                                                                'block rounded-sm px-3 py-2 text-sm',
                                                                whenCurrentUrl(
                                                                    item.href,
                                                                    'bg-accent/50 text-accent-foreground',
                                                                ),
                                                            )}
                                                        >
                                                            {item.title}
                                                        </Link>
                                                    </NavigationMenuLink>
                                                </li>
                                            ))}
                                        </ul>
                                    </NavigationMenuContent>
                                    {(isCurrentUrl('/users') ||
                                        isCurrentUrl('/locais') ||
                                        isCurrentUrl('/perfis') ||
                                        isCurrentUrl('/empresas') ||
                                        isCurrentUrl('/fornecedores') ||
                                        isCurrentUrl('/tipos-colaborador') ||
                                        isCurrentUrl('/situacoes-colaborador') ||
                                        isCurrentUrl('/colaboradores')) && (
                                        <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-primary"></div>
                                    )}
                                </NavigationMenuItem>
                                <NavigationMenuItem className="relative flex h-full items-center">
                                    <NavigationMenuTrigger
                                        className={cn(
                                            whenCurrentUrl(
                                                '/config-estoque/tipos-materiais',
                                                activeItemStyles,
                                            ) ||
                                                whenCurrentUrl(
                                                    '/config-estoque/marcas',
                                                    activeItemStyles,
                                                ) ||
                                                whenCurrentUrl(
                                                    '/config-estoque/tipos-estoque',
                                                    activeItemStyles,
                                                ),
                                            'h-9 cursor-pointer px-3',
                                        )}
                                    >
                                        Configurações de Estoque
                                    </NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <ul className="grid w-[240px] gap-1 p-2">
                                            {configuracoesEstoqueNavItems.map((item) => (
                                                <li key={item.title}>
                                                    <NavigationMenuLink asChild>
                                                        <Link
                                                            href={item.href}
                                                            className={cn(
                                                                'block rounded-sm px-3 py-2 text-sm',
                                                                whenCurrentUrl(
                                                                    item.href,
                                                                    'bg-accent/50 text-accent-foreground',
                                                                ),
                                                            )}
                                                        >
                                                            {item.title}
                                                        </Link>
                                                    </NavigationMenuLink>
                                                </li>
                                            ))}
                                        </ul>
                                    </NavigationMenuContent>
                                    {(isCurrentUrl('/config-estoque/tipos-materiais') ||
                                        isCurrentUrl('/config-estoque/marcas') ||
                                        isCurrentUrl('/config-estoque/tipos-estoque')) && (
                                        <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-primary"></div>
                                    )}
                                </NavigationMenuItem>
                                <NavigationMenuItem className="relative flex h-full items-center">
                                    <NavigationMenuTrigger
                                        className={cn(
                                            whenCurrentUrl(
                                                '/operacoes-estoque/estoques',
                                                activeItemStyles,
                                            ) ||
                                                (isCurrentOrParentUrl('/operacoes-estoque/entradas-lote')
                                                    ? activeItemStyles
                                                    : null),
                                            'h-9 cursor-pointer px-3',
                                        )}
                                    >
                                        Operações de Estoque
                                    </NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <ul className="grid w-[220px] gap-1 p-2">
                                            {operacoesEstoqueNavItems.map((item) => (
                                                <li key={item.title}>
                                                    <NavigationMenuLink asChild>
                                                        <Link
                                                            href={item.href}
                                                            className={cn(
                                                                'block rounded-sm px-3 py-2 text-sm',
                                                                whenCurrentUrl(
                                                                    item.href,
                                                                    'bg-accent/50 text-accent-foreground',
                                                                ),
                                                            )}
                                                        >
                                                            {item.title}
                                                        </Link>
                                                    </NavigationMenuLink>
                                                </li>
                                            ))}
                                        </ul>
                                    </NavigationMenuContent>
                                    {(isCurrentUrl('/operacoes-estoque/estoques') ||
                                        isCurrentOrParentUrl('/operacoes-estoque/entradas-lote')) && (
                                        <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-primary"></div>
                                    )}
                                </NavigationMenuItem>
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    <div className="ml-auto flex items-center space-x-2 lg:ml-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="group h-9 w-9 cursor-pointer"
                        >
                            <Search className="size-5! opacity-80 group-hover:opacity-100" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="size-10 rounded-full p-1"
                                >
                                    <Avatar className="size-8 overflow-hidden rounded-full">
                                        <AvatarImage
                                            src={auth.user.avatar}
                                            alt={auth.user.name}
                                        />
                                        <AvatarFallback className="rounded-lg bg-muted text-foreground">
                                            {getInitials(auth.user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                <UserMenuContent user={auth.user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
            {breadcrumbs.length > 1 && (
                <div className="flex w-full border-b border-sidebar-border/70">
                    <div className="flex h-12 w-full items-center justify-start px-4 text-muted-foreground">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            )}
        </>
    );
}
