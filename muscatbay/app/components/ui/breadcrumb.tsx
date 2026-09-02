// components/ui/Breadcrumb.tsx
// "Dashboard › Water". Max 3 levels. Sits directly above PageHeader.
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

type Crumb = { label: string; href?: string };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-label text-muted">
      <Home size={14} strokeWidth={2} aria-hidden />
      {items.slice(0, 3).map((c, i) => {
        const last = i === items.length - 1;
        return (
          <span key={c.label} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={14} strokeWidth={2} aria-hidden />}
            {c.href && !last
              ? <Link href={c.href} className="hover:text-fg">{c.label}</Link>
              : <span aria-current={last ? 'page' : undefined} className={last ? 'font-medium text-fg' : undefined}>{c.label}</span>}
          </span>
        );
      })}
    </nav>
  );
}
