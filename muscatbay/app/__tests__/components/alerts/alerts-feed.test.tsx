import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import type { AckableAlert } from '@/hooks/useOperationalAlerts';

/**
 * The alert card is the tap target: its title link is stretched over the whole
 * card, and Acknowledge / Reopen stay separate buttons that never navigate.
 */

// Plain anchor stand-in — keeps the test off the App Router context and lets a
// click be observed without jsdom attempting a real navigation.
vi.mock('next/link', () => ({
    default: ({ href, children, onClick, replace, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode; replace?: boolean }) => (
        <a
            href={href}
            data-replace={replace ? 'true' : 'false'}
            onClick={(e) => {
                e.preventDefault();
                onClick?.(e);
            }}
            {...rest}
        >
            {children}
        </a>
    ),
}));

let currentPath = '/';
vi.mock('next/navigation', () => ({
    usePathname: () => currentPath,
}));

const acknowledgeAlert = vi.fn();
const unacknowledgeAlert = vi.fn();
const dismiss = vi.fn();
let operationalAlerts: AckableAlert[] = [];
let notifications: { id: string; level: 'warning'; title: string; message?: string; timestamp: Date; href?: string }[] = [];

vi.mock('@/components/providers/notification-provider', () => ({
    useAppNotifications: () => ({
        notifications,
        dismiss,
        operationalAlerts,
        alertStatus: 'ready',
        alertUnavailableSources: [],
        alertEvaluatedAt: new Date(),
        acknowledgeAlert,
        unacknowledgeAlert,
    }),
}));

import { AlertsFeed } from '@/components/alerts/alerts-feed';

const waterAlert: AckableAlert = {
    id: 'water-loss:Aug-26',
    level: 'error',
    module: 'water',
    title: 'Water loss critically above target',
    message: 'Aug-26: system loss is 31.0% of supply.',
    href: '/water?view=monthly&month=Aug-26&section=overview',
    acknowledged: false,
};

describe('AlertsFeed', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        operationalAlerts = [waterAlert];
        notifications = [];
        currentPath = '/';
    });

    it('links the card to the alert’s own view, described by its message', () => {
        render(<AlertsFeed />);
        const link = screen.getByRole('link', { name: waterAlert.title });
        expect(link).toHaveAttribute('href', waterAlert.href);
        expect(link).toHaveAccessibleDescription(waterAlert.message);
        // Stretched over the card: the overlay covers the positioned card.
        expect(link.className).toContain('after:absolute');
        expect(link.className).toContain('after:inset-0');
        expect(link.closest('div.relative')).not.toBeNull();
        // One link per card — the "Review" cue is decorative, not a second link.
        expect(screen.getAllByRole('link')).toHaveLength(1);
    });

    it('draws the 3px focus ring on the card, outside the dimmed content of an acknowledged alert', () => {
        operationalAlerts = [{ ...waterAlert, acknowledged: true }];
        render(<AlertsFeed />);
        const link = screen.getByRole('link', { name: waterAlert.title });
        const card = link.closest('div.relative') as HTMLElement;
        expect(card.className).toContain('has-[a:focus-visible]:ring-[3px]');
        // Dimming sits on the content, never on the card that carries the ring.
        expect(card.className).not.toContain('opacity-70');
        expect(card.querySelector('.opacity-70')).not.toBeNull();
    });

    it('pushes when the alert points at another page', () => {
        render(<AlertsFeed />);
        expect(screen.getByRole('link', { name: waterAlert.title })).toHaveAttribute('data-replace', 'false');
    });

    it('replaces for a same-page alert so Back is not a dead entry', () => {
        currentPath = '/water';
        render(<AlertsFeed />);
        expect(screen.getByRole('link', { name: waterAlert.title })).toHaveAttribute('data-replace', 'true');
    });

    it('closes the hosting sheet when the card is opened', () => {
        const onNavigate = vi.fn();
        render(<AlertsFeed onNavigate={onNavigate} />);
        fireEvent.click(screen.getByRole('link', { name: waterAlert.title }));
        expect(onNavigate).toHaveBeenCalledTimes(1);
    });

    it('acknowledges without navigating, and the button is not nested in the link', () => {
        const onNavigate = vi.fn();
        render(<AlertsFeed onNavigate={onNavigate} />);
        const ack = screen.getByRole('button', { name: 'Acknowledge' });
        expect(ack.closest('a')).toBeNull();
        // Raised above the stretched-link overlay so a tap reaches the button.
        expect(ack.className).toContain('relative');
        expect(ack.className).toContain('z-10');
        expect(ack.className).toContain('h-11'); // 44px target
        expect(ack.className).toContain('focus-visible:ring-[3px]'); // brand focus ring
        fireEvent.click(ack);
        expect(acknowledgeAlert).toHaveBeenCalledWith(waterAlert.id);
        expect(onNavigate).not.toHaveBeenCalled();
    });

    it('reopens an acknowledged alert without navigating', () => {
        operationalAlerts = [{ ...waterAlert, acknowledged: true }];
        const onNavigate = vi.fn();
        render(<AlertsFeed onNavigate={onNavigate} />);
        fireEvent.click(screen.getByRole('button', { name: /Reopen/ }));
        expect(unacknowledgeAlert).toHaveBeenCalledWith(waterAlert.id);
        expect(onNavigate).not.toHaveBeenCalled();
    });

    it('makes a session notification tappable only when it carries an href', () => {
        operationalAlerts = [];
        notifications = [
            { id: 'n1', level: 'warning', title: 'STP: High inlet sewage', message: 'Above threshold.', timestamp: new Date(), href: '/stp?tab=dashboard' },
            { id: 'n2', level: 'warning', title: 'Informational only', timestamp: new Date() },
        ];
        render(<AlertsFeed />);
        expect(screen.getByRole('link', { name: 'STP: High inlet sewage' })).toHaveAttribute('href', '/stp?tab=dashboard');
        expect(screen.queryByRole('link', { name: 'Informational only' })).toBeNull();
        const dismissButton = screen.getByRole('button', { name: 'Dismiss: STP: High inlet sewage' });
        expect(dismissButton.closest('a')).toBeNull();
        fireEvent.click(dismissButton);
        expect(dismiss).toHaveBeenCalledWith('n1');
    });
});
