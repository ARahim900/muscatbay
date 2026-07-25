/**
 * Session context + biometric app lock.
 *
 * Two independent gates:
 *   1. `status` — is there a valid Supabase session? Drives the route guard.
 *   2. `locked` — has the user passed biometric unlock since the app was last
 *      backgrounded? Only armed when they turn it on in Settings, and it never
 *      blocks anyone whose device has no enrolled biometrics.
 *
 * Also owns the AppState listener that drives Supabase's token auto-refresh,
 * per the official React Native guidance: refresh while in the foreground,
 * stop while backgrounded.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import type { ModuleKey, Role } from '@/lib/rbac';
import { canAccessModule } from '@/lib/rbac';
import {
  loadSessionUser,
  onAuthStateChange,
  signIn as doSignIn,
  signOut as doSignOut,
  type SessionUser,
} from '~/adapters/auth';
import { getSupabaseClient } from '~/adapters/supabase-client';
import { authenticate } from '~/lib/biometrics';
import { useTheme } from '~/theme/theme-provider';

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface SessionContextValue {
  status: SessionStatus;
  user: SessionUser | null;
  role: Role;
  locked: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  unlock: () => Promise<boolean>;
  /** Same predicate the web sidebar uses, so both platforms hide the same modules. */
  canAccess: (module: ModuleKey) => boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { settings, ready: settingsReady } = useTheme();
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [user, setUser] = useState<SessionUser | null>(null);
  const [locked, setLocked] = useState(false);
  const biometricLockRef = useRef(settings.biometricLock);

  biometricLockRef.current = settings.biometricLock;

  const refresh = useCallback(async () => {
    const next = await loadSessionUser();
    setUser(next);
    setStatus(next ? 'authenticated' : 'unauthenticated');
    return next;
  }, []);

  // Initial session read.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // React to sign-in / sign-out / token refresh from anywhere.
  useEffect(() => onAuthStateChange(() => void refresh()), [refresh]);

  // Arm the lock as soon as the preference is switched on and settings load.
  useEffect(() => {
    if (settingsReady && settings.biometricLock && status === 'authenticated') {
      setLocked(true);
    }
  }, [settingsReady, settings.biometricLock, status]);

  // Supabase auto-refresh must follow the app lifecycle on React Native.
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;

    client.auth.startAutoRefresh().catch(() => {});

    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        client.auth.startAutoRefresh().catch(() => {});
      } else {
        client.auth.stopAutoRefresh().catch(() => {});
        // Re-arm the lock whenever the app leaves the foreground.
        if (biometricLockRef.current) setLocked(true);
      }
    });

    return () => {
      subscription.remove();
      client.auth.stopAutoRefresh().catch(() => {});
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      await doSignIn(email, password);
      await refresh();
      setLocked(false);
    },
    [refresh],
  );

  const signOut = useCallback(async () => {
    await doSignOut();
    setUser(null);
    setStatus('unauthenticated');
    setLocked(false);
  }, []);

  const unlock = useCallback(async () => {
    const passed = await authenticate();
    if (passed) setLocked(false);
    return passed;
  }, []);

  const role: Role = user?.role ?? 'viewer';

  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      user,
      role,
      locked: locked && status === 'authenticated',
      signIn,
      signOut,
      unlock,
      canAccess: (module: ModuleKey) => canAccessModule(role, module),
    }),
    [status, user, role, locked, signIn, signOut, unlock],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used inside <SessionProvider>');
  return context;
}
