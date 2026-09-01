import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export function buildCsp(nonce: string, isDev = process.env.NODE_ENV !== 'production'): string {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    let supabaseHost = '*.supabase.co'
    try {
        if (supabaseUrl) supabaseHost = new URL(supabaseUrl).host
    } catch {
        // A malformed deployment variable must not prevent security headers
        // from being emitted. Supabase requests will fail closed separately.
    }
    const liveDevScript = isDev ? ' http://localhost:8400' : ''
    const liveDevConnect = isDev ? ' http://localhost:8400 ws://localhost:8400' : ''
    const scriptPolicy = isDev
        ? `'self' 'unsafe-eval' 'unsafe-inline'${liveDevScript}`
        : `'self' 'nonce-${nonce}' 'strict-dynamic'`
    return [
        `default-src 'self'`,
        `script-src ${scriptPolicy}`,
        `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
        `font-src 'self' https://fonts.gstatic.com`,
        `img-src 'self' data: https:`,
        `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}${liveDevConnect}`,
        `frame-src 'self' https://aitable.ai https://drive.google.com`,
        `frame-ancestors 'none'`,
        `base-uri 'self'`,
        `form-action 'self'`,
        `object-src 'none'`,
        ...(isDev ? [] : ['upgrade-insecure-requests']),
    ].join('; ')
}

/**
 * CSP for the self-hosted Satellite View map engine (/satellite/*), which the
 * Water page embeds in a same-origin iframe. Two deliberate differences from
 * the app-wide policy — everything else stays as strict:
 *
 * - `frame-ancestors 'self'` (not 'none'): the engine exists to be framed by
 *   this app. Only this origin may frame it; foreign sites still cannot.
 * - Map runtime allowances: satellite/terrain tiles are fetched from public
 *   tile CDNs (`connect-src https:`), and MapLibre spins its worker from a
 *   blob URL (`worker-src blob:`). Neither is needed — or granted — anywhere
 *   else in the app.
 */
export function buildSatelliteCsp(): string {
    return [
        `default-src 'self'`,
        `script-src 'self' 'sha256-Xgw0wwrzqHD2i9ttcCubeN7sHBhnYTz9sFyiMUs/M5I=' 'sha256-cKcS1Ohc5Ek1dGmA065wKqk1js+T+mmqLEB3qascgU0='`,
        `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
        `font-src 'self' https://fonts.gstatic.com`,
        `img-src 'self' data: blob: https:`,
        `connect-src 'self' https:`,
        `worker-src blob:`,
        `frame-ancestors 'self'`,
        `base-uri 'self'`,
        `form-action 'none'`,
        `object-src 'none'`,
    ].join('; ')
}

/**
 * The single host the app is served from in production.
 *
 * This app answers on three domains (muscatbay.work, www.muscatbay.work,
 * muscatbay.vercel.app), and that broke Google sign-in on the bare apex.
 * Two host-scoped mechanisms are behind it:
 *
 * - Supabase matches OAuth redirect URLs exactly, and its allow-list holds the
 *   **https www** callback, not the apex one.
 * - The browser client stores the PKCE code verifier per host, so a sign-in
 *   must finish on the host that started it.
 *
 * The result was two half-working front doors: a session made on one host is
 * invisible on the other, and a sign-in begun on the apex could never
 * complete. Canonicalising fixes both at once — one session domain, and every
 * OAuth round-trip runs on the host Supabase already accepts.
 *
 * Preview deployments and localhost are deliberately untouched.
 *
 * To move the canonical host later (e.g. once the apex callback is added to
 * the Supabase allow-list and the bare domain is preferred), swap the two
 * constants below — nothing else depends on the choice.
 */
const CANONICAL_HOST = 'www.muscatbay.work'
const HOSTS_REDIRECTED_TO_CANONICAL = new Set(['muscatbay.work'])

export async function proxy(request: NextRequest) {
    // Canonical-host redirect runs first: it must happen before any auth
    // cookie is refreshed, so a session is never written against the host the
    // user is about to leave.
    const requestHost = (request.headers.get('host') ?? '').toLowerCase().split(':')[0]
    if (HOSTS_REDIRECTED_TO_CANONICAL.has(requestHost)) {
        const canonicalUrl = request.nextUrl.clone()
        canonicalUrl.protocol = 'https:'
        canonicalUrl.host = CANONICAL_HOST
        canonicalUrl.port = ''
        return NextResponse.redirect(canonicalUrl, 308)
    }

    const nonce = crypto.randomUUID()
    const isSatellite = request.nextUrl.pathname.startsWith('/satellite/')
    const cspHeader = process.env.CSP_REPORT_ONLY === 'true'
        ? 'Content-Security-Policy-Report-Only'
        : 'Content-Security-Policy'
    const csp = isSatellite ? buildSatelliteCsp() : buildCsp(nonce)
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-nonce', nonce)
    // Next.js reads the request CSP to attach the nonce to framework scripts.
    // The browser enforces only the response header set below.
    requestHeaders.set('Content-Security-Policy', csp)

    let response = NextResponse.next({
        request: { headers: requestHeaders },
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (supabaseUrl && supabaseAnonKey) {
        // Create a Supabase client configured to use cookies
        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value }) => {
                            request.cookies.set(name, value)
                        })
                        response = NextResponse.next({ request: { headers: requestHeaders } })
                        cookiesToSet.forEach(({ name, value, options }) => {
                            response.cookies.set(name, value, options)
                        })
                    },
                },
            }
        )

        // Refresh session if expired - required for Server Components
        // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
        await supabase.auth.getUser()
    }

    // Security headers — applied to every navigation response. The Satellite
    // View engine is the one page this app frames itself, so it gets its own
    // policy (same-origin framing allowed, map-tile fetches allowed).
    response.headers.set(cspHeader, csp)
    response.headers.set('X-Content-Type-Options', 'nosniff')
    if (isSatellite) {
        response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    } else {
        response.headers.set('X-Frame-Options', 'DENY')
    }
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/*     — ALL Next.js internals (HMR chunks, data, static, image)
         * - api/*       — API routes handle their own auth
         * - favicon.ico — icon
         * - static asset extensions (images, fonts, manifests, etc.)
         *
         * Why the stricter exclude list: in dev mode the browser fires many
         * HMR/chunk/data requests per page load. If every one hits the
         * proxy, `supabase.auth.getUser()` runs per-request and quickly
         * trips Supabase's auth rate limit (HTTP 429 / "Request rate limit
         * reached"), which used to collapse the page on load. Auth only
         * needs refreshing for actual navigations and RSC requests.
         */
        '/((?!_next|api|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|avif|woff2?|ttf|otf|txt|xml|json)$).*)',
    ],
}
