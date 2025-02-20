// src/app/auth/callback/route.ts

import { createServerSupabase } from '@/features/auth/utils/supabase-server'
import { NextResponse } from 'next/server'
import { getTeamMemberByEmail } from '@/lib/airtable'
import { ErrorLogger } from '@/lib/logging/error-logger'
import { ErrorSeverity, ErrorSource } from '@/lib/types/errors'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (!code) {
      await ErrorLogger.log(
        new Error('Auth callback received no code parameter'),
        {
          severity: ErrorSeverity.MEDIUM,
          source: ErrorSource.SERVER
        }
      )
      return NextResponse.redirect(new URL('/', request.url))
    }

    const supabase = await createServerSupabase()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      await ErrorLogger.log(
        error,
        {
          severity: ErrorSeverity.HIGH,
          source: ErrorSource.SERVER,
          context: { error: error.message }
        }
      )
      return NextResponse.redirect(new URL('/auth/error', request.url))
    }

    // Domain validation
    if (!data.user?.email?.endsWith('@purelightpower.com')) {
      await supabase.auth.signOut()
      return NextResponse.redirect(
        new URL('/?error=invalid_domain', request.url)
      )
    }

    // Get team member data
    const teamMember = await getTeamMemberByEmail(data.user.email)
    if (!teamMember) {
      await supabase.auth.signOut()
      return NextResponse.redirect(
        new URL('/?error=no_team_member', request.url)
      )
    }

    return NextResponse.redirect(new URL('/dashboard', request.url))
  } catch (error) {
    await ErrorLogger.log(
      error,
      {
        severity: ErrorSeverity.HIGH,
        source: ErrorSource.SERVER,
        context: { error: error instanceof Error ? error.message : String(error) }
      }
    )
    return NextResponse.redirect(new URL('/auth/error', request.url))
  }
}