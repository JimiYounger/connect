import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { VideoAnalyticsService } from '@/features/analytics/services/video-analytics-service'
import { validateUUID } from '@/lib/validation'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET: Fetch user details for a specific video with optional filtering
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    
    // Validate video ID
    const videoId = validateUUID(id, 'Video ID')
    
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

    // Verify video exists
    const { data: video } = await supabase
      .from('video_files')
      .select('id, title')
      .eq('id', videoId)
      .single()

    if (!video) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      )  
    }

    // Get filters from query params
    const url = new URL(req.url)
    const orgFilters = {
      region: url.searchParams.get('region') || undefined,
      area: url.searchParams.get('area') || undefined,
      team: url.searchParams.get('team') || undefined
    }

    // Remove undefined values
    Object.keys(orgFilters).forEach(key => {
      if (orgFilters[key as keyof typeof orgFilters] === undefined) {
        delete orgFilters[key as keyof typeof orgFilters]
      }
    })

    // Fetch user details
    const userDetails = await VideoAnalyticsService.getVideoUserDetails(videoId, orgFilters)

    return NextResponse.json({
      success: true,
      data: {
        videoId,
        videoTitle: video.title,
        filters: orgFilters,
        users: userDetails
      }
    })

  } catch (error) {
    console.error('Error in video users API:', error)
    
    // Handle validation errors with 400 status
    if (error instanceof Error && (error.message.includes('Invalid') || error.message.includes('must be a valid UUID'))) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}