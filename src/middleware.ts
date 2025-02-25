// src/middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/features/auth/middleware/auth'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { ErrorLogger } from '@/lib/logging/error-logger'
import { ErrorSeverity, ErrorSource } from '@/lib/types/errors'

export async function middleware(request: NextRequest) {
  try {
    // Update session if needed
    const res = await updateSession(request)

    // Add public URLs and API routes that handle their own auth
    const publicUrls = ['/', '/auth/callback', '/api/log-error', '/login']
    const authFlowUrls = ['/auth/callback'] // Add URLs that are part of the auth flow
    const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
    const isPublicUrl = publicUrls.includes(request.nextUrl.pathname)
    const isAuthFlow = authFlowUrls.includes(request.nextUrl.pathname) || 
                      request.nextUrl.pathname.startsWith('/auth/')
    
    // Skip session check for public URLs, API routes, and auth flow URLs
    if (!isPublicUrl && !isApiRoute && !isAuthFlow) {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value
            },
          },
        }
      )

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        const redirectUrl = new URL('/', request.url)
        redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }

    return res
  } catch (error) {
    // Keep error logging for critical middleware errors
    await ErrorLogger.log(
      error,
      {
        severity: ErrorSeverity.HIGH,
        source: ErrorSource.SERVER,
        context: {
          path: request.nextUrl.pathname,
          method: request.method,
          headers: Object.fromEntries(request.headers.entries())
        }
      }
    )

    // Return a generic error response
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}