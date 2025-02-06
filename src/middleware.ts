import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If user is not signed in and trying to access protected route
    if (!session && !req.nextUrl.pathname.startsWith('/')
        && !req.nextUrl.pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // If user is signed in and trying to access auth pages
    if (session && (req.nextUrl.pathname === '/' || req.nextUrl.pathname.startsWith('/auth'))) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return res
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
} 