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
    const publicUrls = ['/', '/auth/callback', '/api/log-error', '/login', '/auth/processing', '/auth/error']
    const authFlowUrls = ['/auth/callback', '/auth/processing', '/auth/error'] 
    const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
    const isPublicUrl = publicUrls.some(url => request.nextUrl.pathname === url || request.nextUrl.pathname.startsWith(url + '?'))
    const isAuthFlow = authFlowUrls.some(url => request.nextUrl.pathname === url || request.nextUrl.pathname.startsWith(url + '?'))
    
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

      // Check for auth-related cookies or headers
      const hasAuthCookie = request.cookies.has('sb-access-token') || 
                           request.cookies.has('sb-refresh-token') ||
                           request.cookies.has('supabase-auth-token')
      
      // Check referrer to see if we're coming from an auth flow
      const referrer = request.headers.get('referer') || ''
      const isComingFromAuthFlow = authFlowUrls.some(url => referrer.includes(url)) || hasAuthCookie
      
      // If we don't have a session and we're not coming from an auth flow, redirect to home
      if (!session) {
        // If the user has auth cookies but session isn't ready, give it a chance
        // This helps with race conditions where cookies exist but session isn't fully established
        if (isComingFromAuthFlow) {
          console.log('Coming from auth flow, allowing page to load despite no session')
          // Return the response as-is, letting the page load
          // The client-side code will handle redirecting if needed
          return res
        }
        
        const redirectUrl = new URL('/', request.url)
        // Only add the redirectedFrom param if we're not already on the home page
        if (request.nextUrl.pathname !== '/') {
          redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
        }
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