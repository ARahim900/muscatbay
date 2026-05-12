import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Build a per-request Content-Security-Policy header.
 * We generate a fresh nonce for every request and emit a `script-src`
 * directive that combines:
 *   - `'nonce-<NONCE>'`  — explicitly authorises Next.js's own inline scripts
 *   - `'strict-dynamic'` — modern browsers IGNORE 'unsafe-inline' and only
 *                          trust scripts loaded by nonce'd scripts
 *   - `'unsafe-inline'`  — fallback for older browsers that don't support
 *                          strict-dynamic; these browsers are < 5% globally
 *                          and the nonce gives modern browsers strong XSS
 *                          protection without breaking legacy
 *   - `'unsafe-eval'`    — Recharts uses Function() internally for animations;
 *                          remove this if/when Recharts ships a CSP-safe build
 *
 * Style-src keeps `'unsafe-inline'` because Tailwind's runtime utilities
 * and styled-jsx both inject inline <style> tags that we cannot nonce
 * without major refactor.
 */
function buildCsp(nonce: string): string {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : '*.supabase.co'
    return [
        `default-src 'self'`,
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' 'unsafe-inline'`,
        `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
        `font-src 'self' https://fonts.gstatic.com`,
        `img-src 'self' data: https:`,
        `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
        `frame-src 'self' https://airtable.com https://*.airtable.com https://aitable.ai https://*.aitable.ai https://grafana.nec-oman.com`,
        `frame-ancestors 'none'`,
        `base-uri 'self'`,
        `form-action 'self'`,
        `object-src 'none'`,
    ].join('; ')
}

export async function proxy(request: NextRequest) {
    // Generate a fresh nonce for every request. Web Crypto is available in
    // the edge runtime; 16 bytes → 22 char base64 ≈ 128 bits entropy.
    const nonceBytes = new Uint8Array(16)
    crypto.getRandomValues(nonceBytes)
    const nonce = btoa(String.fromCharCode(...nonceBytes))

    // Propagate the nonce to Server Components / Pages via a request header
    // so they can apply it to their own inline scripts when needed.
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-nonce', nonce)

    let response = NextResponse.next({
        request: { headers: requestHeaders },
    })

    // Create a Supabase client configured to use cookies
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    // Security headers — applied to every navigation response.
    response.headers.set('Content-Security-Policy', buildCsp(nonce))
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

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
