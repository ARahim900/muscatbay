// components/ui/Badge.tsx
// Status pill: muted tint background + readable text, 22px tall.
// Replaces the filled saturated "Critical" / "Healthy" badges.
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const tones: Record<Tone, string> = {
  success: 'bg-success-tint text-success', warning: 'bg-warning-tint text-warning',
  danger: 'bg-danger-tint text-danger', info: 'bg-info-tint text-info', neutral: 'bg-neutral-tint text-neutral',
};

export function Badge({ tone = 'neutral', icon: Icon, dot, children, className }:
  { tone?: Tone; icon?: LucideIcon; dot?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex h-[22px] items-center gap-1 rounded-pill px-2 text-caption font-medium', tones[tone], className)}>
      {dot && <span aria-hidden className="h-1.5 w-1.5 rounded-pill bg-current" />}
      {Icon && <Icon size={12} strokeWidth={2} aria-hidden />}
      {children}
    </span>
  );
}
