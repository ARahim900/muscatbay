import { vi, beforeAll, afterAll } from 'vitest';
import '@testing-library/jest-dom';

// Mock Next.js router
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}));

// Mock Supabase client for tests
vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
                order: vi.fn(() => Promise.resolve({ data: [], error: null })),
                range: vi.fn(() => Promise.resolve({ data: [], count: 0, error: null })),
            })),
        })),
        auth: {
            getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
        },
    })),
}));

// Suppress console errors during tests (optional, remove if you want to see them)
const originalError = console.error;
beforeAll(() => {
    console.error = (...args: Parameters<typeof console.error>) => {
        if (
            typeof args[0] === 'string' &&
            args[0].includes('Warning: ReactDOM.render is no longer supported')
        ) {
            return;
        }
        originalError.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalError;
});
