import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { VideoAnalyticsService } from '@/features/analytics/services/video-analytics-service'

// GET: Fetch daily engagement metrics for the video library
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user profile to check permissions
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role_type')
      .eq('user_id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check if user has admin access
    if (userProfile.role_type?.toLowerCase() !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required for analytics' },
        { status: 403 }
      )
    }

    // Get days from query params (default 30 days)
    const url = new URL(req.url)
    const days = parseInt(url.searchParams.get('days') || '30')

    // Validate days parameter
    if (days < 1 || days > 365) {
      return NextResponse.json(
        { success: false, error: 'Days parameter must be between 1 and 365' },
        { status: 400 }
      )
    }

    // Fetch daily engagement metrics
    const engagement = await VideoAnalyticsService.getDailyEngagement(days)

    return NextResponse.json({
      success: true,
      data: {
        days,
        metrics: engagement
      }
    })

  } catch (error) {
    console.error('Error in engagement API:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}