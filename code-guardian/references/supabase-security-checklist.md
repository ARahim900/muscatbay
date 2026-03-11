# Supabase Security & Usage Checklist

## Client Setup (Muscat Bay Pattern)

### Required Pattern
```tsx
import { isSupabaseConfigured, getSupabaseClient } from '@/lib/supabase'

// Always check configuration before making calls
if (!isSupabaseConfigured()) {
  // Fall back to mock/demo data
  return mockData
}

const supabase = getSupabaseClient()
// Now safe to use supabase client
```

### Common Violations
- Using `createClient()` directly instead of `getSupabaseClient()`
- Not checking `isSupabaseConfigured()` before Supabase calls
- Importing Supabase client at module level (should be lazy/on-demand)
- Hardcoding Supabase URL or anon key (must use env vars)

## Authentication

### Auth Functions (from lib/auth.ts)
- `signUp(email, password)` — Create new account
- `signIn(email, password)` — Sign in existing user
- `signOut()` — Sign out current user
- `getCurrentUser()` — Get current session user

### Security Checks
- Never expose service role key in client-side code
- Always verify auth state before protected operations
- Handle auth errors gracefully (expired session, invalid token)
- Use Supabase auth helpers for middleware/route protection
- Check for session before data mutations

## Database Queries

### Safe Query Patterns
```tsx
// GOOD: Parameterized query
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('column', value)

// BAD: String concatenation (SQL injection risk)
const { data } = await supabase
  .from('table')
  .select(`*, ${userInput}`)  // NEVER do this
```

### Error Handling
```tsx
// ALWAYS handle errors from Supabase
const { data, error } = await supabase.from('table').select('*')
if (error) {
  console.error('Failed to fetch:', error.message)
  // Show user-friendly error, don't expose raw error
  return
}
// Safe to use data here
```

### Common Query Bugs
- Not using `.single()` when expecting exactly one row
- Not checking `error` return value
- Using `.select('*')` when only specific columns are needed
- Missing `.order()` causing inconsistent result ordering
- Not handling empty result sets (data may be empty array)
- Race conditions when multiple queries update same data

## Row Level Security (RLS)

### Checks
- Verify RLS is enabled on all tables with user data
- Policies should restrict access to authenticated users' own data
- Never trust client-side auth state for authorization — RLS enforces at DB level
- Test that users cannot access other users' data
- Service role key bypasses RLS — never use on client side

## Data Fetching Patterns

### Parallel Fetches (Project Convention)
```tsx
// GOOD: Use Promise.allSettled for resilient parallel fetching
const [usersResult, ordersResult] = await Promise.allSettled([
  supabase.from('users').select('*'),
  supabase.from('orders').select('*'),
])

const users = usersResult.status === 'fulfilled' ? usersResult.value.data : []
const orders = ordersResult.status === 'fulfilled' ? ordersResult.value.data : []
```

### Real-time Subscriptions
- Always unsubscribe in cleanup function
- Handle connection errors
- Don't subscribe to more channels than needed

## Storage

### Security
- Verify bucket policies restrict access appropriately
- Validate file types before upload
- Set file size limits
- Use signed URLs for private files (not public URLs)
- Sanitize file names before upload

## Environment Variables

### Required Env Vars
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Public anon key (safe for client)
- Server-side only: `SUPABASE_SERVICE_ROLE_KEY` (never expose to client)

### Checks
- No hardcoded Supabase URLs or keys in source code
- Env vars prefixed with `NEXT_PUBLIC_` are exposed to client — only use for public data
- Service role key must NOT have `NEXT_PUBLIC_` prefix
