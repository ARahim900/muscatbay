// components/ui/SectionCard.tsx
// Any content block. Header is a FIXED 56px slot (title + one description
// line); footer is a FIXED 40px slot. That is what keeps side-by-side cards
// the same height. Insight text, status lines and "how this is calculated"
// links go in the Footer or in an info tooltip — never in the header.
//
//   <SectionCard>
//     <SectionCard.Header title="Monthly supply" description="m³, left axis" icon={Activity} action={<Button …/>} />
//     <SectionCard.Body><ChartFrame …/></SectionCard.Body>
//     <SectionCard.Footer>Latest month is 17.4% below the prior month.</SectionCard.Footer>
//   </SectionCard>
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/cn';

function Root({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn('flex h-full flex-col rounded-card border border-line bg-card shadow-card', className)}>
      {children}
    </section>
  );
}

function Header({ title, description, icon: Icon, info, action }:
  { title: string; description?: string; icon?: LucideIcon; info?: string; action?: ReactNode }) {
  return (
    <div className="flex h-card-header shrink-0 items-center justify-between gap-4 border-b border-line px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && <Icon size={16} strokeWidth={2} className="shrink-0 text-muted" aria-hidden />}
        <div className="min-w-0">
          <h2 className="truncate text-title text-primary dark:text-fg">{title}</h2>
          {description && <p className="truncate text-caption text-muted">{description}</p>}
        </div>
        {info && (
          <span className="shrink-0 text-muted" title={info} aria-label={info}>
            <Info size={14} strokeWidth={2} />
          </span>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function Body({ children, className, flush }: { children: ReactNode; className?: string; flush?: boolean }) {
  // `flush` for tables and iframes that need edge-to-edge content.
  return <div className={cn('min-h-0 flex-1', flush ? '' : 'p-5', className)}>{children}</div>;
}

function Footer({ children, tone = 'neutral' }:
  { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }) {
  const dot = { neutral: 'bg-neutral', success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger', info: 'bg-info' }[tone];
  return (
    <div className="flex h-card-footer shrink-0 items-center gap-2 border-t border-line px-5 text-caption text-muted">
      <span aria-hidden className={cn('h-1.5 w-1.5 shrink-0 rounded-pill', dot)} />
      <span className="truncate">{children}</span>
    </div>
  );
}

export const SectionCard = Object.assign(Root, { Header, Body, Footer });
