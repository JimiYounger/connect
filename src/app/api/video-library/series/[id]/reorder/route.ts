// Series content reordering endpoint for drag-and-drop functionality

import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role_type')
      .eq('user_id', user.id)
      .single()

    if (!userProfile || userProfile.role_type?.toLowerCase() !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { id: seriesId } = await params
    const { ordered_content } = await req.json()

    if (!Array.isArray(ordered_content)) {
      return NextResponse.json(
        { success: false, error: 'ordered_content must be an array' },
        { status: 400 }
      )
    }

    // Verify the series exists
    const { data: series, error: seriesError } = await supabase
      .from('video_series')
      .select('id')
      .eq('id', seriesId)
      .single()

    if (seriesError || !series) {
      return NextResponse.json(
        { success: false, error: 'Series not found' },
        { status: 404 }
      )
    }

    // Update order indices for all content items
    const updatePromises = ordered_content.map(async (item, index) => {
      const { content_id, content_type, season_number = 1, module_name } = item
      
      if (!content_id || !content_type) {
        throw new Error('Each item must have content_id and content_type')
      }

      return supabase
        .from('series_content')
        .update({
          order_index: index,
          season_number,
          module_name: module_name?.trim() || null
        })
        .eq('series_id', seriesId)
        .eq('content_type', content_type)
        .eq('content_id', content_id)
    })

    const results = await Promise.all(updatePromises)

    // Check if any updates failed
    const errors = results.filter(result => result.error)
    if (errors.length > 0) {
      console.error('Some reorder updates failed:', errors)
      return NextResponse.json(
        { success: false, error: 'Some content items could not be reordered' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully reordered ${ordered_content.length} content items`
    })

  } catch (error) {
    console.error('Error in series reorder API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}