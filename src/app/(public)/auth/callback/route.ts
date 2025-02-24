// src/app/auth/callback/route.ts

import { createServerSupabase } from '@/features/auth/utils/supabase-server'
import { NextResponse } from 'next/server'
import { ErrorLogger } from '@/lib/logging/error-logger'
import { ErrorSeverity, ErrorSource } from '@/lib/types/errors'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const baseUrl = requestUrl.origin

  try {
    const code = requestUrl.searchParams.get('code')

    if (!code) {
      await ErrorLogger.log(
        new Error('Auth callback received no code parameter'),
        {
          severity: ErrorSeverity.MEDIUM,
          source: ErrorSource.SERVER
        }
      )
      return NextResponse.redirect(`${baseUrl}/`)
    }

    const supabase = await createServerSupabase()
    const { error, data: { user } } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error || !user?.email) {
      await ErrorLogger.log(
        error || new Error('No user data after code exchange'),
        {
          severity: ErrorSeverity.HIGH,
          source: ErrorSource.SERVER,
          context: { error: error?.message || 'No user data' }
        }
      )
      return NextResponse.redirect(`${baseUrl}/auth/error`)
    }

    // Domain validation
    if (!user.email.endsWith('@purelightpower.com')) {
      await supabase.auth.signOut()
      return NextResponse.redirect(`${baseUrl}/?error=invalid_domain`)
    }

    // Check for existing profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, user_id')
      .eq('email', user.email)
      .single()

    if (profile) {
      // Update existing profile with user_id if not set
      if (!profile.user_id) {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ user_id: user.id })
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
          // Set minimum required fields
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
        return NextResponse.redirect(`${baseUrl}/auth/error`)
      }
    }

    // Final redirect
    return NextResponse.redirect(`${baseUrl}/dashboard`, {
      status: 302
    })
  } catch (error) {
    await ErrorLogger.log(
      error,
      {
        severity: ErrorSeverity.HIGH,
        source: ErrorSource.SERVER,
        context: { error: error instanceof Error ? error.message : String(error) }
      }
    )
    return NextResponse.redirect(`${baseUrl}/auth/error`)
  }
}