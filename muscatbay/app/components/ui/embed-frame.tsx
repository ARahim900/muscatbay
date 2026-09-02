// components/ui/EmbedFrame.tsx
// Framed iframe for external tools (Pest Control / AITable).
// The frame — not the embedded tool — sets the look of the page:
// SectionCard chrome, fixed 720px, "Open in AITable" action, loading skeleton.
// Theme is passed via URL param when the tool supports it; the iframe gets
// `color-scheme` so Chrome/Firefox render it to match (Safari ignores this).
'use client';
import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SectionCard } from './section-card';
import { Button } from './mb-button';

type Props = {
  title: string;              // "Daily report database"
  description?: string;       // "Maintained by the pest control team in AITable"
  icon?: LucideIcon;
  src: string;                // embed URL (a VIEW url, not the base's cover page)
  openHref: string;           // full-page URL for the button
  themeParam?: 'theme';       // append ?theme=light|dark if the provider supports it
  theme?: 'light' | 'dark';
};

export function EmbedFrame({ title, description, icon, src, openHref, themeParam, theme = 'light' }: Props) {
  const [ready, setReady] = useState(false);
  const url = themeParam ? `${src}${src.includes('?') ? '&' : '?'}${themeParam}=${theme}` : src;

  return (
    <SectionCard>
      <SectionCard.Header title={title} description={description} icon={icon}
        action={<Button size="sm" icon={ExternalLink} onClick={() => window.open(openHref, '_blank', 'noopener')}>Open full view</Button>} />
      <SectionCard.Body flush className="relative h-embed overflow-hidden rounded-b-card">
        {!ready && <div aria-hidden className="absolute inset-0 animate-pulse bg-component" />}
        <iframe title={title} src={url} loading="lazy" onLoad={() => setReady(true)}
          className="h-full w-full border-0" style={{ colorScheme: theme }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
      </SectionCard.Body>
      <SectionCard.Footer>External data source · read-only preview</SectionCard.Footer>
    </SectionCard>
  );
}
