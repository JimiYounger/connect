// Get available videos and documents that can be added to series

import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

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

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const contentType = searchParams.get('type') // 'video', 'document', or null for both
    const seriesId = searchParams.get('series_id') // exclude content already in this series
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const results: any = {
      videos: [],
      documents: []
    }

    // Fetch videos if requested
    if (!contentType || contentType === 'video') {
      let videoQuery = supabase
        .from('video_files')
        .select(`
          id,
          title,
          description,
          vimeo_duration,
          vimeo_thumbnail_url,
          custom_thumbnail_url,
          thumbnail_source,
          video_category_id,
          video_subcategory_id,
          created_at,
          video_categories(name),
          video_subcategories(name)
        `)
        .eq('library_status', 'approved')

      if (search) {
        videoQuery = videoQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
      }

      const { data: videos, error: videoError } = await videoQuery
        .order('title')
        .range(offset, offset + limit - 1)

      if (videoError) {
        console.error('Error fetching videos:', videoError)
      } else {
        // Exclude videos already in the specified series
        let filteredVideos = videos || []
        
        if (seriesId) {
          const { data: existingContent } = await supabase
            .from('series_content')
            .select('content_id')
            .eq('series_id', seriesId)
            .eq('content_type', 'video')

          const existingVideoIds = existingContent?.map(c => c.content_id) || []
          filteredVideos = filteredVideos.filter(v => !existingVideoIds.includes(v.id))
        }

        results.videos = filteredVideos.map(video => ({
          id: video.id,
          title: video.title,
          description: video.description,
          duration: video.vimeo_duration,
          thumbnail_url: video.thumbnail_source === 'custom' 
            ? video.custom_thumbnail_url 
            : video.vimeo_thumbnail_url,
          category: video.video_categories?.name,
          subcategory: video.video_subcategories?.name,
          type: 'video',
          created_at: video.created_at
        }))
      }
    }

    // Fetch documents if requested
    if (!contentType || contentType === 'document') {
      let documentQuery = supabase
        .from('documents')
        .select(`
          id,
          title,
          description,
          preview_image_url,
          document_category_id,
          document_subcategory_id,
          created_at,
          document_categories(name),
          document_subcategories(name)
        `)

      if (search) {
        documentQuery = documentQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
      }

      const { data: documents, error: documentError } = await documentQuery
        .order('title')
        .range(offset, offset + limit - 1)

      if (documentError) {
        console.error('Error fetching documents:', documentError)
      } else {
        // Exclude documents already in the specified series  
        let filteredDocuments = documents || []
        
        if (seriesId) {
          const { data: existingContent } = await supabase
            .from('series_content')
            .select('content_id')
            .eq('series_id', seriesId)
            .eq('content_type', 'document')

          const existingDocumentIds = existingContent?.map(c => c.content_id) || []
          filteredDocuments = filteredDocuments.filter(d => !existingDocumentIds.includes(d.id))
        }

        results.documents = filteredDocuments.map(document => ({
          id: document.id,
          title: document.title,
          description: document.description,
          preview_image_url: document.preview_image_url,
          category: document.document_categories?.name,
          subcategory: document.document_subcategories?.name,
          type: 'document',
          created_at: document.created_at
        }))
      }
    }

    // Combine and sort results by relevance if searching
    let allContent = []
    if (contentType === 'video') {
      allContent = results.videos
    } else if (contentType === 'document') {
      allContent = results.documents
    } else {
      allContent = [...results.videos, ...results.documents]
      // Sort by title if no specific type requested
      allContent.sort((a, b) => a.title.localeCompare(b.title))
    }

    return NextResponse.json({
      success: true,
      data: contentType ? allContent : results,
      total: allContent.length,
      limit,
      offset
    })

  } catch (error) {
    console.error('Error in available content API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}