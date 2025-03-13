// src/app/auth/callback/route.ts

import { createServerSupabase } from '@/features/auth/utils/supabase-server'
import { NextResponse } from 'next/server'
import { ErrorLogger } from '@/lib/logging/error-logger'
import { ErrorSeverity, ErrorSource } from '@/lib/types/errors'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const baseUrl = requestUrl.origin
  const code = requestUrl.searchParams.get('code')

  try {
    if (!code) {
      await ErrorLogger.log(
        new Error('Auth callback received no code parameter'),
        {
          severity: ErrorSeverity.MEDIUM,
          source: ErrorSource.SERVER
        }
      )
      return NextResponse.redirect(`${baseUrl}/auth/error?reason=no_code`)
    }

    const supabase = await createServerSupabase()
    
    // Exchange code for session
    const { error: sessionError, data: { user, session } } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError || !user?.email || !session) {
      await ErrorLogger.log(
        sessionError || new Error('No user/session data after code exchange'),
        {
          severity: ErrorSeverity.HIGH,
          source: ErrorSource.SERVER,
          context: { error: sessionError?.message || 'No user/session data' }
        }
      )
      return NextResponse.redirect(`${baseUrl}/auth/error?reason=session_error`)
    }

    // Domain validation
    if (!user.email.endsWith('@purelightpower.com')) {
      await supabase.auth.signOut()
      return NextResponse.redirect(`${baseUrl}/?error=invalid_domain`)
    }

    try {
      // Check for existing profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, user_id')
        .eq('email', user.email)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError
      }

      if (profile) {
        // Update existing profile with user_id if not set
        if (!profile.user_id) {
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ 
              user_id: user.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', profile.id)

          if (updateError) {
            await ErrorLogger.log(
              updateError,
              {
                severity: ErrorSeverity.MEDIUM,
                source: ErrorSource.SERVER,
                context: { 
                  action: 'update_user_id',
                  profileId: profile.id,
                  userId: user.id 
                }
              }
            )
          }
        }
      } else {
        // Create basic profile if none exists
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            email: user.email,
            user_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            first_name: user.email.split('@')[0], // Temporary name from email
            last_name: '-',
            role: 'Pending',
            role_type: 'Admin', // Default to valid role type
            team: 'Pending',
            area: 'Pending',
            airtable_record_id: 'pending' // Temporary until sync
          })

        if (insertError) {
          await ErrorLogger.log(
            insertError,
            {
              severity: ErrorSeverity.HIGH,
              source: ErrorSource.SERVER,
              context: { 
                action: 'create_profile',
                email: user.email,
                userId: user.id 
              }
            }
          )
          return NextResponse.redirect(`${baseUrl}/auth/error?reason=profile_creation_failed`)
        }
      }

      // Set secure session cookie
      const response = NextResponse.redirect(`${baseUrl}/auth/processing`, {
        status: 302
      })

      // Add cache control headers to prevent caching of auth responses
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      
      return response
    } catch (error) {
      await ErrorLogger.log(
        error,
        {
          severity: ErrorSeverity.HIGH,
          source: ErrorSource.SERVER,
          context: { 
            action: 'profile_management',
            email: user.email,
            error: error instanceof Error ? error.message : String(error)
          }
        }
      )
      return NextResponse.redirect(`${baseUrl}/auth/error?reason=profile_error`)
    }
  } catch (error) {
    await ErrorLogger.log(
      error,
      {
        severity: ErrorSeverity.HIGH,
        source: ErrorSource.SERVER,
        context: { error: error instanceof Error ? error.message : String(error) }
      }
    )
    return NextResponse.redirect(`${baseUrl}/auth/error?reason=unknown`)
  }
}