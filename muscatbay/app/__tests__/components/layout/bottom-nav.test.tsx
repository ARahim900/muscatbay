import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// `next/link` is not mocked globally (only `next/navigation` is), and the dock
// reads `useLinkStatus`, which only exists inside a real <Link>.
vi.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href, ...rest }: React.PropsWithChildren<{ href: string }>) => (
        <a href={href} {...rest}>{children}</a>
    ),
    useLinkStatus: () => ({ pending: false }),
}));

vi.mock('@/components/auth/auth-provider', () => ({
    useAuth: () => ({ profile: null, user: null, logout: vi.fn(), isDevMode: true }),
}));

vi.mock('@/hooks/useUserRole', () => ({ useUserRole: () => 'admin' as const }));

vi.mock('@/components/providers/app-providers', () => ({
    useTheme: () => ({ resolvedTheme: 'dark' as const, setTheme: vi.fn() }),
}));

vi.mock('@/components/providers/notification-provider', () => ({
    useAppNotifications: () => ({
        notifications: [],
        unreadCount: 0,
        clearAll: vi.fn(),
        permission: 'granted' as const,
        requestPermission: vi.fn(),
        markFeedOpened: vi.fn(),
    }),
}));

vi.mock('@/components/alerts/alerts-feed', () => ({ AlertsFeed: () => <div /> }));

import { BottomNav } from '@/components/layout/bottom-nav';

/** Opens the Modules sheet so its content leaves the aria-hidden state. */
function openSheet() {
    render(<BottomNav />);
    fireEvent.click(screen.getByRole('button', { name: 'Modules' }));
}

describe('BottomNav sheet close button', () => {
    it('carries a ≥44px touch target in BOTH axes on coarse pointers', () => {
        openSheet();
        const close = screen.getByRole('button', { name: 'Close menu' });

        // The coarse-pointer rule in globals.css only floors block size, so the
        // width floor has to be declared here (WCAG 2.5.5).
        expect(close.className).toContain('pointer-coarse:min-h-11');
        expect(close.className).toContain('pointer-coarse:min-w-11');
    });

    it('keeps its 36px mouse sizing', () => {
        openSheet();
        const close = screen.getByRole('button', { name: 'Close menu' });

        expect(close.className).toContain('w-9');
        expect(close.className).toContain('h-9');
    });
});
