import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const pathname = request.nextUrl.pathname

  // Only apply to /api routes
  if (pathname.startsWith("/api/")) {
    // Add security headers
    const response = NextResponse.next()

    // Prevent caching of sensitive data
    response.headers.set("Cache-Control", "no-store, max-age=0")

    // Add CORS headers if needed
    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")

    // Add basic security headers
    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-XSS-Protection", "1; mode=block")

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/api/:path*",
}
