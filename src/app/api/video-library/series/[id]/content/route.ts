// Series content management endpoints - add/remove videos and documents

import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(
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
    const { 
      content_type, 
      content_id, 
      order_index = 0,
      season_number = 1,
      module_name 
    } = await req.json()

    // Validate input
    if (!content_type || !content_id) {
      return NextResponse.json(
        { success: false, error: 'content_type and content_id are required' },
        { status: 400 }
      )
    }

    if (!['video', 'document'].includes(content_type)) {
      return NextResponse.json(
        { success: false, error: 'content_type must be "video" or "document"' },
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

    // Verify the content exists
    const tableName = content_type === 'video' ? 'video_files' : 'documents'
    const { data: content, error: contentError } = await supabase
      .from(tableName)
      .select('id, title')
      .eq('id', content_id)
      .single()

    if (contentError || !content) {
      return NextResponse.json(
        { success: false, error: `${content_type} not found` },
        { status: 404 }
      )
    }

    // Check if content is already in this series
    const { data: existingContent } = await supabase
      .from('series_content')
      .select('id')
      .eq('series_id', seriesId)
      .eq('content_type', content_type)
      .eq('content_id', content_id)
      .single()

    if (existingContent) {
      return NextResponse.json(
        { success: false, error: 'Content is already in this series' },
        { status: 409 }
      )
    }

    // Add content to series
    const { data: newContent, error } = await supabase
      .from('series_content')
      .insert({
        series_id: seriesId,
        content_type,
        content_id,
        order_index,
        season_number,
        module_name: module_name?.trim() || null
      })
      .select(`
        id,
        content_type,
        content_id,
        order_index,
        season_number,
        module_name,
        created_at
      `)
      .single()

    if (error) {
      console.error('Error adding content to series:', error)
      return NextResponse.json(
        { success: false, error: `Failed to add content: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...newContent,
        content_title: content.title
      }
    })

  } catch (error) {
    console.error('Error in series content POST API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}

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
    const { content_updates } = await req.json()

    if (!Array.isArray(content_updates)) {
      return NextResponse.json(
        { success: false, error: 'content_updates must be an array' },
        { status: 400 }
      )
    }

    // Process bulk updates for reordering
    const updatePromises = content_updates.map(async (update) => {
      const { content_id, content_type, order_index, season_number, module_name } = update
      
      if (!content_id || !content_type) {
        throw new Error('content_id and content_type are required for each update')
      }

      return supabase
        .from('series_content')
        .update({
          order_index: order_index !== undefined ? order_index : undefined,
          season_number: season_number !== undefined ? season_number : undefined,
          module_name: module_name !== undefined ? (module_name?.trim() || null) : undefined
        })
        .eq('series_id', seriesId)
        .eq('content_type', content_type)
        .eq('content_id', content_id)
    })

    await Promise.all(updatePromises)

    return NextResponse.json({
      success: true,
      message: `Updated ${content_updates.length} content items`
    })

  } catch (error) {
    console.error('Error in series content PUT API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const { content_type, content_id } = await req.json()

    if (!content_type || !content_id) {
      return NextResponse.json(
        { success: false, error: 'content_type and content_id are required' },
        { status: 400 }
      )
    }

    // Remove content from series
    const { error } = await supabase
      .from('series_content')
      .delete()
      .eq('series_id', seriesId)
      .eq('content_type', content_type)
      .eq('content_id', content_id)

    if (error) {
      console.error('Error removing content from series:', error)
      return NextResponse.json(
        { success: false, error: `Failed to remove content: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Content removed from series successfully'
    })

  } catch (error) {
    console.error('Error in series content DELETE API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}