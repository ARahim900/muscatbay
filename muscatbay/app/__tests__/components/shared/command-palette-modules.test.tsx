import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { CommandPalette } from '@/components/shared/command-palette';
import { MODULE_ROUTE } from '@/lib/rbac';

/**
 * The palette is the one navigation surface a keyboard user reaches from
 * anywhere, and its module list is hand-written — `NAV_ITEMS` is an array, not
 * a `Record<ModuleKey, …>`, so a module added to `lib/rbac.ts` compiles fine
 * while being unreachable here. This test is the compile error that is missing.
 */

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() }),
    usePathname: () => '/',
}));
vi.mock('@/components/auth/auth-provider', () => ({
    useAuth: () => ({ logout: vi.fn(), isDevMode: false }),
}));
vi.mock('@/components/providers/app-providers', () => ({
    useTheme: () => ({ resolvedTheme: 'dark', setTheme: vi.fn() }),
}));
vi.mock('@/hooks/useUserRole', () => ({ useUserRole: () => 'admin' }));

afterEach(cleanup);

describe('command palette', () => {
    it('can reach every module in the RBAC route map', () => {
        render(<CommandPalette open onClose={vi.fn()} />);
        const list = within(screen.getByRole('listbox'));
        for (const route of Object.values(MODULE_ROUTE)) {
            expect(list.getAllByText(route).length).toBeGreaterThan(0);
        }
    });
});
