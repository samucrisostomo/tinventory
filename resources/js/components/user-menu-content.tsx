import { Link, router } from '@inertiajs/react';
import { LogOut, Moon, Settings, Sun } from 'lucide-react';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useAppearance } from '@/hooks/use-appearance';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import type { User } from '@/types';

type Props = {
    user: User;
};

type ViewTransition = {
    ready?: Promise<void>;
    finished?: Promise<void>;
};

type ViewTransitionDocument = Document & {
    startViewTransition?: (
        callback: () => void,
    ) => ViewTransition;
};

export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();
    const { resolvedAppearance, updateAppearance } = useAppearance();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    const toggleTheme = (target?: HTMLElement) => {
        cleanup();
        const nextTheme =
            resolvedAppearance === 'dark' ? 'light' : 'dark';
        const doc = document as ViewTransitionDocument;
        const root = document.documentElement;

        const applyTheme = () => updateAppearance(nextTheme);

        if (!target || typeof doc.startViewTransition !== 'function') {
            applyTheme();
            return;
        }

        const viewportWidth =
            window.visualViewport?.width ?? window.innerWidth;
        const viewportHeight =
            window.visualViewport?.height ?? window.innerHeight;

        const { left, top, width, height } =
            target.getBoundingClientRect();
        const x = left + width / 2;
        const y = top + height / 2;
        const maxRadius = Math.hypot(
            Math.max(x, viewportWidth - x),
            Math.max(y, viewportHeight - y),
        );

        root.dataset.themeTransition = 'active';
        root.style.setProperty(
            '--theme-toggle-vt-duration',
            '450ms',
        );

        const transition = doc.startViewTransition(() => {
            applyTheme();
        });

        transition.finished?.finally(() => {
            delete root.dataset.themeTransition;
            root.style.removeProperty('--theme-toggle-vt-duration');
        });

        transition.ready?.then(() => {
            document.documentElement.animate(
                {
                    clipPath: [
                        `circle(0px at ${x}px ${y}px)`,
                        `circle(${maxRadius}px at ${x}px ${y}px)`,
                    ],
                },
                {
                    duration: 450,
                    easing: 'ease-in-out',
                    fill: 'forwards',
                    pseudoElement: '::view-transition-new(root)',
                },
            );
        });
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full cursor-pointer"
                        href={edit()}
                        prefetch
                        onClick={cleanup}
                    >
                        <Settings className="mr-2" />
                        Settings
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="gap-2"
                    onSelect={(e) => {
                        e.preventDefault();
                        toggleTheme(e.currentTarget as HTMLElement);
                    }}
                >
                    {resolvedAppearance === 'dark' ? (
                        <>
                            <Sun className="size-4" />
                            Modo claro
                        </>
                    ) : (
                        <>
                            <Moon className="size-4" />
                            Modo escuro
                        </>
                    )}
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link
                    className="block w-full cursor-pointer"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="mr-2" />
                    Log out
                </Link>
            </DropdownMenuItem>
        </>
    );
}
