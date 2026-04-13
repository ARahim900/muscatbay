import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: { headers: request.headers },
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
                    response = NextResponse.next({ request })
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
