import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { VideoAnalyticsService } from '@/features/analytics/services/video-analytics-service'

// GET: Fetch trending videos based on views and completion rates
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

    // Get parameters from query params
    const url = new URL(req.url)
    const days = parseInt(url.searchParams.get('days') || '7')
    const limit = parseInt(url.searchParams.get('limit') || '10')

    // Validate parameters
    if (days < 1 || days > 365) {
      return NextResponse.json(
        { success: false, error: 'Days parameter must be between 1 and 365' },
        { status: 400 }
      )
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, error: 'Limit parameter must be between 1 and 100' },
        { status: 400 }
      )
    }

    // Fetch trending videos
    const trending = await VideoAnalyticsService.getTrendingVideos(days, limit)

    return NextResponse.json({
      success: true,
      data: {
        days,
        limit,
        videos: trending
      }
    })

  } catch (error) {
    console.error('Error in trending API:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}