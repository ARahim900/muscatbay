/**
 * Auth for the mobile app, against the same Supabase project as the web app.
 *
 * Reused verbatim from the web app:
 *   • `@/lib/rbac`       — Role, ModuleKey, ROLE_MODULES, normalizeRole,
 *                          canAccessModule. The role model is identical on both
 *                          platforms by construction, not by duplication.
 *   • `@/lib/validation` — validateEmail / validatePassword.
 *
 * Not reused: `@/lib/auth` itself. Its sign-in flow is sound, but
 * `resetPassword()` builds its redirect from `window.location.origin` and
 * `uploadAvatar()` takes a DOM `File`, neither of which exists here. The four
 * calls below are the mobile equivalents; everything security-relevant (generic
 * error text to prevent user enumeration, least-privilege role default) matches
 * the web behaviour.
 */
import * as Linking from 'expo-linking';

import { normalizeRole, type Role } from '@/lib/rbac';
import { validateEmail } from '@/lib/validation';
import { getSupabaseClient } from '~/adapters/supabase-client';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: Role;
}

class NotConfiguredError extends Error {
  constructor() {
    super('Supabase is not configured. Check mobile/.env and restart Expo.');
    this.name = 'NotConfiguredError';
  }
}

function requireClient() {
  const client = getSupabaseClient();
  if (!client) throw new NotConfiguredError();
  return client;
}

/**
 * Sign in with email + password.
 *
 * The error text is deliberately generic and identical for "no such user" and
 * "wrong password" — same anti-enumeration rule as `lib/auth.ts` on the web.
 */
export async function signIn(email: string, password: string): Promise<void> {
  const emailCheck = validateEmail(email);
  if (!emailCheck.isValid || !password) {
    throw new Error('Invalid email or password');
  }

  const client = requireClient();
  const { error } = await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) throw new Error('Invalid email or password');
}

export async function signOut(): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.auth.signOut();
}

/**
 * Send a password-reset email.
 *
 * The redirect is an app deep link (`muscatbay://auth/reset-password`) rather
 * than the web app's `window.location.origin`, so tapping the email on a phone
 * comes back into this app. That link must be added to the Supabase project's
 * "Redirect URLs" allow-list — see mobile/README.md.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const emailCheck = validateEmail(email);
  if (!emailCheck.isValid) throw new Error(emailCheck.error ?? 'Enter a valid email address');

  const client = requireClient();
  const redirectTo = Linking.createURL('/auth/reset-password');
  const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo,
  });

  // Do not leak whether the address exists — report success either way, but
  // still surface genuine transport failures so the user is not left guessing.
  if (error && error.status && error.status >= 500) {
    throw new Error('Could not reach the authentication service. Check your connection.');
  }
}

/**
 * Resolve the signed-in user and their role.
 *
 * Reads the `profiles` row with the same explicit column list the web app uses
 * (no `SELECT *`). A missing or unreadable profile resolves to the
 * least-privileged `viewer` via `normalizeRole`, matching web RBAC exactly.
 */
export async function loadSessionUser(): Promise<SessionUser | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.auth.getSession();
  if (error || !data.session?.user) return null;

  const authUser = data.session.user;
  const metadata = authUser.user_metadata as { full_name?: string; avatar_url?: string } | null;

  const profile = await client
    .from('profiles')
    .select('id, email, full_name, avatar_url, role')
    .eq('id', authUser.id)
    .maybeSingle<{
      id: string;
      email: string | null;
      full_name: string | null;
      avatar_url: string | null;
      role: string | null;
    }>();

  if (profile.error) {
    // A readable session with an unreadable profile is still a valid session;
    // fall back to least privilege rather than bouncing the user to sign-in.
    console.warn('Could not read profile row:', profile.error.message);
  }

  return {
    id: authUser.id,
    email: profile.data?.email ?? authUser.email ?? '',
    fullName: profile.data?.full_name ?? metadata?.full_name ?? null,
    avatarUrl: profile.data?.avatar_url ?? metadata?.avatar_url ?? null,
    role: normalizeRole(profile.data?.role),
  };
}

/** Subscribe to sign-in / sign-out. Returns an unsubscribe function. */
export function onAuthStateChange(callback: () => void): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};
  const { data } = client.auth.onAuthStateChange(() => callback());
  return () => data.subscription.unsubscribe();
}
