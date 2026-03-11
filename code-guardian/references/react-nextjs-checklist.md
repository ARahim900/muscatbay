# React 19 & Next.js 16 App Router Checklist

## React 19 Patterns

### Hooks Rules
- Never call hooks conditionally or inside loops
- Always call hooks at the top level of the component
- Custom hooks must start with `use` prefix
- `useEffect` must have correct dependency array:
  - Include ALL variables referenced inside the effect
  - Use `useCallback`/`useMemo` to stabilize object/function deps
  - Add cleanup function for subscriptions, timers, event listeners
- `useState` setter with callback form for state derived from previous state: `setState(prev => prev + 1)`
- Do NOT read state immediately after `setState` — it's async

### Common React Bugs
- **Infinite re-render**: Object/array literals in dependency arrays
  ```tsx
  // BAD: new object every render triggers infinite loop
  useEffect(() => { ... }, [{ key: value }])
  // GOOD: use primitive deps or useMemo
  const memoizedConfig = useMemo(() => ({ key: value }), [value])
  useEffect(() => { ... }, [memoizedConfig])
  ```
- **Stale closure**: Reading state inside async callbacks
  ```tsx
  // BAD: count may be stale
  const handleClick = async () => {
    await someAsyncOp()
    setCount(count + 1)  // stale!
  }
  // GOOD: use functional update
  const handleClick = async () => {
    await someAsyncOp()
    setCount(prev => prev + 1)
  }
  ```
- **Memory leak**: Missing cleanup in useEffect
  ```tsx
  useEffect(() => {
    const timer = setInterval(fn, 1000)
    return () => clearInterval(timer)  // cleanup!
  }, [])
  ```
- **Missing key prop**: Lists must have stable, unique keys (NEVER use array index for dynamic lists)
- **Unmounted state update**: Check if component is still mounted before setting state in async callbacks

### Component Patterns
- Use `"use client"` directive only when component uses hooks, browser APIs, or event handlers
- Server components by default in Next.js App Router — no directive needed
- Provider pattern for hydration safety (wrap client providers)
- Prefer composition over inheritance
- Extract custom hooks for reusable stateful logic

### Performance
- `useMemo` for expensive computations
- `useCallback` for functions passed as props to memoized children
- `React.memo` for pure components that receive complex props
- Lazy load heavy components with `React.lazy` + `Suspense`
- Avoid creating new objects/arrays in JSX props inline

## Next.js 16 App Router Patterns

### File Conventions
- `page.tsx` — Route page component
- `layout.tsx` — Shared layout (wraps children)
- `loading.tsx` — Loading UI (Suspense boundary)
- `error.tsx` — Error boundary
- `not-found.tsx` — 404 page
- All route files are server components by default

### Data Fetching
- Server components: fetch data directly (no useEffect)
- Client components: use hooks or SWR/React Query
- Use `Promise.allSettled` for parallel fetches (project convention)
- Handle loading, error, and empty states for all data displays

### Common Next.js Bugs
- Using `window`/`document` in server component (add `"use client"` or dynamic import)
- Missing `"use client"` on components that use `useState`, `useEffect`, or event handlers
- Importing server-only code in client components
- Not handling `params` correctly in dynamic routes
- Missing `metadata` export for SEO

### Routing
- App directory structure: `app/[route]/page.tsx`
- Dynamic routes: `app/[id]/page.tsx`
- Route groups: `app/(group)/route/page.tsx`
- Parallel routes and intercepting routes for advanced patterns
- `Link` component for client-side navigation (not `<a>` tags)

### Image Optimization
- Use `next/image` for all images (auto optimization)
- Always provide `width`/`height` or use `fill` prop
- Use `priority` for above-the-fold images
