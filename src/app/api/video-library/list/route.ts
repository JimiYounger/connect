// my-app/src/app/api/video-library/list/route.ts

// API route for fetching videos with filters
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export interface VideoListParams {
  video_category_id?: string
  video_subcategory_id?: string
  video_series_id?: string
  tags?: string[]
  admin_selected?: boolean
  library_status?: 'pending' | 'processing' | 'completed' | 'error'
  searchQuery?: string
  page?: number
  limit?: number
}

export async function POST(req: Request) {
  try {
    // Parse request body
    const params = await req.json()
    const {
      video_category_id,
      video_subcategory_id,
      video_series_id,
      tags: _tags,
      admin_selected,
      library_status,
      searchQuery: _searchQuery,
      page = 1,
      limit = 20
    } = params

    // Calculate offset for pagination
    const offset = (page - 1) * limit
    
    // Track IDs from filtering for counting
    let _matchingTranscriptIds: string[] | undefined
    let _matchingTagIds: string[] | undefined
    let _visibleVideoIds: string[] = []

    // Get the authenticated user
    const supabase = await createClient()
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
      .select('id, role_type, team, area, region')
      .eq('user_id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Start building the query - simplified to avoid foreign key errors
    let query = supabase
      .from('video_files')
      .select(`
        *,
        video_categories (id, name),
        video_subcategories (id, name),
        video_series (id, name)
      `)
      
    // Apply category filter
    if (video_category_id) {
      query = query.eq('video_category_id', video_category_id)
    }
    
    // Apply subcategory filter
    if (video_subcategory_id) {
      query = query.eq('video_subcategory_id', video_subcategory_id)
    }
    
    // Apply series filter
    if (video_series_id) {
      query = query.eq('video_series_id', video_series_id)
    }
    
    // Apply admin_selected filter
    if (admin_selected !== undefined) {
      query = query.eq('admin_selected', admin_selected)
    }
    
    // Apply library_status filter
    if (library_status) {
      query = query.eq('library_status', library_status)
    }
    
    // Skip visibility filtering for now - will implement later
    // Admin users can see all videos
    
    // Skip search and tag filtering for now - will implement later
    // Focus on basic listing first
    
    // Create a simple count query
    let countQuery = supabase
      .from('video_files')
      .select('*', { count: 'exact', head: true })

    // Apply the same basic filters as the main query
    if (video_category_id) {
      countQuery = countQuery.eq('video_category_id', video_category_id)
    }
    
    if (video_subcategory_id) {
      countQuery = countQuery.eq('video_subcategory_id', video_subcategory_id)
    }
    
    if (video_series_id) {
      countQuery = countQuery.eq('video_series_id', video_series_id)
    }
    
    if (admin_selected !== undefined) {
      countQuery = countQuery.eq('admin_selected', admin_selected)
    }
    
    if (library_status) {
      countQuery = countQuery.eq('library_status', library_status)
    }
    
    // Execute the count query
    const { count, error: countError } = await countQuery
    
    if (countError) {
      console.error('Error getting video count:', countError)
      return NextResponse.json(
        { success: false, error: `Failed to get video count: ${countError.message}` },
        { status: 500 }
      )
    }
    
    // Use the count (will be null if no rows match)
    const total = count || 0
    
    // Apply pagination
    query = query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // Execute the query
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching videos:', error)
      return NextResponse.json(
        { success: false, error: `Failed to fetch videos: ${error.message}` },
        { status: 500 }
      )
    }
    
    // Get chunks count and tags for each video
    const processedData = await Promise.all(data.map(async (video) => {
      // Get chunks count
      const { count: chunksCount } = await supabase
        .from('video_chunks')
        .select('*', { count: 'exact', head: true })
        .eq('video_file_id', video.id)

      // Get tags
      const { data: tagData } = await supabase
        .from('video_tag_assignments')
        .select(`
          video_tags (name)
        `)
        .eq('video_file_id', video.id)

      const tags = tagData?.map(item => item.video_tags?.name).filter(Boolean) || []

      // Get permissions
      const { data: visibilityData } = await supabase
        .from('video_visibility')
        .select('conditions')
        .eq('video_file_id', video.id)
        .single()

      const permissions = visibilityData?.conditions || { roleTypes: [], teams: [], areas: [], regions: [] }

      // Use summary if available, otherwise generate preview from description
      let summary = video.summary || null;
      let contentPreview: string | null = null;
      
      // If no summary exists, generate contentPreview from description
      if (!summary && video.description) {
        contentPreview = video.description.substring(0, 300) + (video.description.length > 300 ? '...' : '')
      }
      
      return {
        id: video.id,
        title: video.title,
        description: video.description,
        vimeoId: video.vimeo_id,
        vimeoUri: video.vimeo_uri,
        vimeoDuration: video.vimeo_duration,
        vimeoThumbnailUrl: video.vimeo_thumbnail_url,
        customThumbnailUrl: video.custom_thumbnail_url,
        thumbnailSource: video.thumbnail_source,
        vimeoMetadata: video.vimeo_metadata,
        category: video.video_categories,
        subcategory: video.video_subcategories,
        series: video.video_series,
        summary,
        contentPreview,
        tags,
        adminSelected: video.admin_selected,
        libraryStatus: video.library_status,
        transcriptStatus: video.transcript_status,
        embeddingStatus: video.embedding_status,
        summaryStatus: video.summary_status,
        createdAt: video.created_at,
        updatedAt: video.updated_at,
        chunksCount: chunksCount || 0,
        permissions
      }
    }))
    
    return NextResponse.json({
      success: true,
      data: processedData,
      total: total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
    
  } catch (error) {
    console.error('Error in video list API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}