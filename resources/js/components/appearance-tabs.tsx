import type { LucideIcon } from 'lucide-react';
import { Moon, Sun } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import type { ResolvedAppearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

export default function AppearanceToggleTab({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { appearance, resolvedAppearance, updateAppearance } =
        useAppearance();

    const tabs: {
        value: ResolvedAppearance;
        icon: LucideIcon;
        label: string;
    }[] = [
        { value: 'light', icon: Sun, label: 'Light' },
        { value: 'dark', icon: Moon, label: 'Dark' },
    ];

    const isTabSelected = (value: ResolvedAppearance) =>
        appearance === value ||
        (appearance === 'system' && resolvedAppearance === value);

    return (
        <div
            className={cn(
                'inline-flex gap-1 rounded-lg bg-muted p-1',
                className,
            )}
            {...props}
        >
            {tabs.map(({ value, icon: Icon, label }) => (
                <button
                    key={value}
                    onClick={() => updateAppearance(value)}
                    className={cn(
                        'flex items-center rounded-md px-3.5 py-1.5 transition-colors',
                        isTabSelected(value)
                            ? 'bg-card text-card-foreground shadow-xs'
                            : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground',
                    )}
                >
                    <Icon className="-ml-1 h-4 w-4" />
                    <span className="ml-1.5 text-sm">{label}</span>
                </button>
            ))}
        </div>
    );
}
