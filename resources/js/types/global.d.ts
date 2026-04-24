import type { Auth } from '@/types/auth';

declare module '@inertiajs/core' {
    interface PageProps {
        name: string;
        auth: Auth;
        sidebarOpen: boolean;
        flash?: {
            success?: string;
            error?: string;
        };
    }
}
