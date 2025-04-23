// src/app/api/users/current/route.ts
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

/**
 * GET - Get current user details
 */
export async function GET() {
  try {
    // Get the authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Error in current user API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}