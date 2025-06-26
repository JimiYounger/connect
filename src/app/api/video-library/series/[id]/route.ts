// Individual video series management endpoints

import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(
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

    const { id } = await params

    // Fetch series with its content
    const { data: series, error } = await supabase
      .from('video_series')
      .select(`
        id,
        name,
        description,
        series_type,
        has_seasons,
        thumbnail_url,
        thumbnail_source,
        thumbnail_color,
        is_public,
        content_count,
        total_duration,
        tags,
        created_at,
        updated_at,
        order_index,
        created_by
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching series:', error)
      return NextResponse.json(
        { success: false, error: `Failed to fetch series: ${error.message}` },
        { status: 500 }
      )
    }

    if (!series) {
      return NextResponse.json(
        { success: false, error: 'Series not found' },
        { status: 404 }
      )
    }

    // Fetch series content
    const { data: content, error: contentError } = await supabase
      .from('series_content')
      .select(`
        id,
        content_type,
        content_id,
        order_index,
        season_number,
        module_name,
        created_at
      `)
      .eq('series_id', id)
      .order('season_number', { ascending: true })
      .order('order_index', { ascending: true })

    if (contentError) {
      console.error('Error fetching series content:', contentError)
      return NextResponse.json(
        { success: false, error: `Failed to fetch series content: ${contentError.message}` },
        { status: 500 }
      )
    }

    // Fetch detailed content information separately
    const processedContent = []
    
    if (content) {
      for (const item of content) {
        const baseItem = {
          id: item.id,
          content_type: item.content_type,
          content_id: item.content_id,
          order_index: item.order_index,
          season_number: item.season_number,
          module_name: item.module_name,
          created_at: item.created_at
        }

        if (item.content_type === 'video') {
          const { data: videoData } = await supabase
            .from('video_files')
            .select('id, title, description, vimeo_duration, vimeo_thumbnail_url, custom_thumbnail_url, thumbnail_source')
            .eq('id', item.content_id)
            .single()

          if (videoData) {
            processedContent.push({
              ...baseItem,
              content: {
                id: videoData.id,
                title: videoData.title,
                description: videoData.description,
                duration: videoData.vimeo_duration,
                thumbnail_url: videoData.thumbnail_source === 'custom' 
                  ? videoData.custom_thumbnail_url 
                  : videoData.vimeo_thumbnail_url,
                type: 'video'
              }
            })
          }
        } else if (item.content_type === 'document') {
          const { data: documentData } = await supabase
            .from('documents')
            .select('id, title, description, preview_image_url')
            .eq('id', item.content_id)
            .single()

          if (documentData) {
            processedContent.push({
              ...baseItem,
              content: {
                id: documentData.id,
                title: documentData.title,
                description: documentData.description,
                preview_image_url: documentData.preview_image_url,
                type: 'document'
              }
            })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...series,
        content: processedContent
      }
    })

  } catch (error) {
    console.error('Error in series GET API:', error)
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

    const { id } = await params
    const { 
      name, 
      description, 
      series_type,
      has_seasons,
      thumbnail_url,
      thumbnail_source,
      thumbnail_color,
      is_public,
      tags
    } = await req.json()

    // Validate series_type if provided
    if (series_type) {
      const validTypes = ['playlist', 'course', 'collection']
      if (!validTypes.includes(series_type)) {
        return NextResponse.json(
          { success: false, error: 'Invalid series type. Must be: playlist, course, or collection' },
          { status: 400 }
        )
      }
    }

    // Build update object with only provided fields
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (series_type !== undefined) updateData.series_type = series_type
    if (has_seasons !== undefined) updateData.has_seasons = has_seasons
    if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url?.trim() || null
    if (thumbnail_source !== undefined) updateData.thumbnail_source = thumbnail_source
    if (thumbnail_color !== undefined) updateData.thumbnail_color = thumbnail_color
    if (is_public !== undefined) updateData.is_public = is_public
    if (tags !== undefined) updateData.tags = tags || []

    // Update the series
    const { data: updatedSeries, error } = await supabase
      .from('video_series')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating series:', error)
      return NextResponse.json(
        { success: false, error: `Failed to update series: ${error.message}` },
        { status: 500 }
      )
    }

    if (!updatedSeries) {
      return NextResponse.json(
        { success: false, error: 'Series not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedSeries
    })

  } catch (error) {
    console.error('Error in series PUT API:', error)
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

    const { id } = await params

    // Delete the series (cascade will handle series_content deletion)
    const { error } = await supabase
      .from('video_series')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting series:', error)
      return NextResponse.json(
        { success: false, error: `Failed to delete series: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Series deleted successfully'
    })

  } catch (error) {
    console.error('Error in series DELETE API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}