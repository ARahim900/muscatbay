import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * public/sw.js — tapping an OS notification must open the notification's own
 * page. Each case below is one way the tap used to land nowhere: a same-origin
 * iframe picked instead of the window, an unawaited navigate, a rejected
 * navigate on an uncontrolled window.
 *
 * The worker is plain script, so it is evaluated against a stand-in `self` and
 * its notificationclick listener is driven directly.
 */

const ORIGIN = 'https://muscatbay.work';
const SW_SOURCE = readFileSync(resolve(__dirname, '../../public/sw.js'), 'utf8');

interface FakeClient {
    url: string;
    frameType: 'top-level' | 'nested' | 'auxiliary' | 'none';
    focused: boolean;
    focus: ReturnType<typeof vi.fn>;
    navigate: ReturnType<typeof vi.fn>;
}

function client(partial: Partial<FakeClient> = {}): FakeClient {
    const c: FakeClient = {
        url: `${ORIGIN}/`,
        frameType: 'top-level',
        focused: false,
        focus: vi.fn(),
        navigate: vi.fn(),
        ...partial,
    };
    c.focus.mockImplementation(() => Promise.resolve(c));
    c.navigate.mockImplementation(() => Promise.resolve(c));
    return c;
}

type Listener = (event: unknown) => void;

function loadWorker(clientList: FakeClient[]) {
    const listeners = new Map<string, Listener>();
    const openWindow = vi.fn(() => Promise.resolve(null));
    const self = {
        addEventListener: (type: string, fn: Listener) => listeners.set(type, fn),
        location: new URL(`${ORIGIN}/sw.js`),
        clients: {
            matchAll: vi.fn(() => Promise.resolve(clientList)),
            openWindow,
            claim: vi.fn(),
        },
        registration: {},
        skipWaiting: vi.fn(),
    };
    new Function('self', 'caches', 'fetch', SW_SOURCE)(self, {}, vi.fn());

    /** Fire a notification tap and wait for everything it handed to waitUntil. */
    async function tap(url: string | undefined): Promise<void> {
        let pending: Promise<unknown> = Promise.resolve();
        listeners.get('notificationclick')?.({
            notification: { close: vi.fn(), data: url === undefined ? undefined : { url } },
            waitUntil: (p: Promise<unknown>) => {
                pending = p;
            },
        });
        await pending;
    }

    return { tap, openWindow };
}

describe('sw.js notificationclick', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('navigates the top-level window, never the Satellite iframe', async () => {
        const frame = client({ url: `${ORIGIN}/satellite/consumption.html?v=24`, frameType: 'nested' });
        const win = client({ url: `${ORIGIN}/water?view=satellite` });
        const { tap, openWindow } = loadWorker([frame, win]);

        await tap('/stp?tab=dashboard&month=Sep-26');

        expect(frame.navigate).not.toHaveBeenCalled();
        expect(win.focus).toHaveBeenCalled();
        expect(win.navigate).toHaveBeenCalledWith(`${ORIGIN}/stp?tab=dashboard&month=Sep-26`);
        expect(openWindow).not.toHaveBeenCalled();
    });

    it('prefers the focused window when several are open', async () => {
        const background = client({ url: `${ORIGIN}/` });
        const focused = client({ url: `${ORIGIN}/contractors`, focused: true });
        const { tap } = loadWorker([background, focused]);

        await tap('/water?view=monthly');

        expect(focused.navigate).toHaveBeenCalledWith(`${ORIGIN}/water?view=monthly`);
        expect(background.navigate).not.toHaveBeenCalled();
    });

    it('opens a new window when navigate rejects (uncontrolled window)', async () => {
        const win = client();
        win.navigate.mockImplementation(() => Promise.reject(new TypeError('not controlled')));
        const { tap, openWindow } = loadWorker([win]);

        await tap('/water?view=monthly&month=Aug-26&section=zones');

        expect(openWindow).toHaveBeenCalledWith(`${ORIGIN}/water?view=monthly&month=Aug-26&section=zones`);
    });

    it('opens a new window when no app window is open', async () => {
        const { tap, openWindow } = loadWorker([client({ url: `${ORIGIN}/satellite/consumption.html`, frameType: 'nested' })]);
        await tap('/stp?tab=watch');
        expect(openWindow).toHaveBeenCalledWith(`${ORIGIN}/stp?tab=watch`);
    });

    it('falls back to the home page for a missing or off-origin url', async () => {
        const win = client();
        const { tap } = loadWorker([win]);
        await tap(undefined);
        expect(win.navigate).toHaveBeenLastCalledWith(`${ORIGIN}/`);
        await tap('https://evil.example/phish');
        expect(win.navigate).toHaveBeenLastCalledWith(`${ORIGIN}/`);
    });
});
