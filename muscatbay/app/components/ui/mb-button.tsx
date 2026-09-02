// components/ui/Button.tsx
// Four variants, three sizes. ONE `primary` per view.
import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  loading?: boolean;
};

const variants = {
  primary:   'bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'border border-line bg-card text-fg hover:bg-component',
  ghost:     'text-muted hover:bg-component hover:text-fg',
  danger:    'bg-danger-tint text-danger hover:brightness-95',
};
const sizes = {
  sm: 'h-7 px-2.5 text-caption font-medium gap-1',
  md: 'h-9 px-3.5 text-label gap-1.5',
  lg: 'h-10 px-4 text-body font-medium gap-2',
};

export function Button({ variant = 'secondary', size = 'md', icon: Icon, loading, className, children, disabled, ...rest }: Props) {
  const iconSize = size === 'sm' ? 14 : 16;
  return (
    <button type="button" disabled={disabled || loading} {...rest}
      className={cn('inline-flex items-center justify-center rounded-control transition-colors duration-200',
        'disabled:cursor-not-allowed disabled:opacity-50', variants[variant], sizes[size], className)}>
      {loading ? <Loader2 size={iconSize} className="animate-spin" aria-hidden />
               : Icon && <Icon size={iconSize} strokeWidth={2} aria-hidden />}
      {children}
    </button>
  );
}
