import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { VideoAnalyticsService } from '@/features/analytics/services/video-analytics-service'

// GET: Fetch organization hierarchy for filter options
export async function GET(_req: Request) {
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

    // Fetch organization hierarchy
    const hierarchy = await VideoAnalyticsService.getOrganizationHierarchy()

    return NextResponse.json({
      success: true,
      data: hierarchy
    })

  } catch (error) {
    console.error('Error in organization API:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}