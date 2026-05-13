import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Build the Content-Security-Policy header.
 *
 * Next.js 16 currently emits required framework inline scripts without a nonce
 * in this app. Using a nonce or strict-dynamic here blocks hydration in modern
 * browsers, leaving users stuck on the splash screen.
 */
function buildCsp(): string {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : '*.supabase.co'
    // Dev-only allowance so the Impeccable live helper (port 8400) can load
    // its picker script and stream SSE events. Removed in production builds.
    const isDev = process.env.NODE_ENV !== 'production'
    const liveDevScript = isDev ? ' http://localhost:8400' : ''
    const liveDevConnect = isDev ? ' http://localhost:8400 ws://localhost:8400' : ''
    return [
        `default-src 'self'`,
        `script-src 'self' 'unsafe-eval' 'unsafe-inline'${liveDevScript}`,
        `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
        `font-src 'self' https://fonts.gstatic.com`,
        `img-src 'self' data: https:`,
        `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}${liveDevConnect}`,
        `frame-src 'self' https://airtable.com https://*.airtable.com https://aitable.ai https://*.aitable.ai https://grafana.nec-oman.com`,
        `frame-ancestors 'none'`,
        `base-uri 'self'`,
        `form-action 'self'`,
        `object-src 'none'`,
    ].join('; ')
}

export async function proxy(request: NextRequest) {
    const requestHeaders = new Headers(request.headers)

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
    response.headers.set('Content-Security-Policy', buildCsp())
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
