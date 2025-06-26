import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { processVideoFile } from '@/features/videoLibrary/services/video-processing-service'

interface BulkImportRequestBody {
  videos: {
    vimeo_url: string
    category_name: string
    subcategory_name?: string
    thumbnail_url?: string
  }[]
}

interface ProcessingResult {
  vimeo_url: string
  status: 'success' | 'error'
  error?: string
  video_id?: string
  title?: string
}

export async function POST(req: Request) {
  try {
    const body: BulkImportRequestBody = await req.json()
    const { videos } = body

    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Videos array is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin and get user profile ID
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('id, role_type')
      .eq('user_id', user.id)
      .single()

    if (!userProfile || userProfile.role_type?.toLowerCase() !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const results: ProcessingResult[] = []

    // Process videos one by one
    for (const video of videos) {
      try {
        const result = await processVideoImport(supabase, video)
        results.push(result)
      } catch (error) {
        console.error(`Error processing video ${video.vimeo_url}:`, error)
        results.push({
          vimeo_url: video.vimeo_url,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        })
      }
    }

    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: errorCount
      }
    })

  } catch (error) {
    console.error('Error in bulk import API:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process bulk import' },
      { status: 500 }
    )
  }
}

async function processVideoImport(
  supabase: any, 
  video: { vimeo_url: string; category_name: string; subcategory_name?: string; thumbnail_url?: string }
): Promise<ProcessingResult> {
  // Extract Vimeo ID from URL
  const vimeoId = extractVimeoId(video.vimeo_url)
  if (!vimeoId) {
    return {
      vimeo_url: video.vimeo_url,
      status: 'error',
      error: 'Invalid Vimeo URL format'
    }
  }

  // Check if video already exists
  const { data: existingVideo } = await supabase
    .from('video_files')
    .select('id, title')
    .eq('vimeo_id', vimeoId)
    .single()

  if (existingVideo) {
    return {
      vimeo_url: video.vimeo_url,
      status: 'error',
      error: `Video already exists: ${existingVideo.title}`,
      video_id: existingVideo.id
    }
  }

  // Fetch video metadata from Vimeo
  const vimeoData = await fetchVimeoVideoData(vimeoId)
  if (!vimeoData) {
    return {
      vimeo_url: video.vimeo_url,
      status: 'error',
      error: 'Failed to fetch video data from Vimeo'
    }
  }

  // Get or create category
  const categoryId = await getOrCreateCategory(supabase, video.category_name)
  if (!categoryId) {
    return {
      vimeo_url: video.vimeo_url,
      status: 'error',
      error: 'Failed to create or find category'
    }
  }

  // Get or create subcategory if provided
  let subcategoryId: string | null = null
  if (video.subcategory_name) {
    subcategoryId = await getOrCreateSubcategory(supabase, video.subcategory_name, categoryId)
    if (!subcategoryId) {
      return {
        vimeo_url: video.vimeo_url,
        status: 'error',
        error: 'Failed to create or find subcategory'
      }
    }
  }

  // Determine thumbnail settings
  const hasCustomThumbnail = video.thumbnail_url && video.thumbnail_url.trim() !== ''
  const thumbnailUrl = hasCustomThumbnail ? video.thumbnail_url?.trim() : null
  const thumbnailSource = hasCustomThumbnail ? 'url' : 'vimeo'

  // Create video record
  const { data: videoFile, error: videoError } = await supabase
    .from('video_files')
    .insert({
      title: vimeoData.name,
      description: vimeoData.description || null,
      vimeo_id: vimeoId,
      vimeo_uri: vimeoData.uri,
      vimeo_duration: vimeoData.duration,
      vimeo_thumbnail_url: vimeoData.pictures?.sizes?.[0]?.link || null,
      vimeo_metadata: vimeoData,
      video_category_id: categoryId,
      video_subcategory_id: subcategoryId,
      library_status: 'pending',
      transcript_status: 'pending',
      embedding_status: 'pending',
      summary_status: 'pending',
      admin_selected: true,
      public_sharing_enabled: false,
      custom_thumbnail_url: thumbnailUrl,
      thumbnail_source: thumbnailSource
    })
    .select('id, title')
    .single()

  if (videoError) {
    console.error('Error creating video file:', videoError)
    return {
      vimeo_url: video.vimeo_url,
      status: 'error',
      error: `Failed to create video record: ${videoError.message}`
    }
  }

  // Trigger processing (transcription, chunking, embeddings, etc.) - same as regular import
  try {
    console.log(`Starting video processing for video file ID: ${videoFile.id}`)
    const result = await processVideoFile(videoFile.id)
    
    if (!result.success) {
      console.warn('Video processing failed:', result.error)
      // Don't fail the import if processing fails - it can be retried later
    } else {
      console.log('Video processing completed successfully')
      
      // Set library_status to 'approved' after successful processing - same as regular import
      const { error: approvalError } = await supabase
        .from('video_files')
        .update({
          library_status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', videoFile.id)
      
      if (approvalError) {
        console.warn('Failed to set library_status to approved:', approvalError)
        // Don't fail the import - video is processed, just approval status wasn't set
      } else {
        console.log('Video approved and added to library')
      }
    }
  } catch (processError) {
    console.warn('Processing trigger failed, but video was created:', processError)
    // Don't fail the import if processing fails - it can be retried later
  }

  return {
    vimeo_url: video.vimeo_url,
    status: 'success',
    video_id: videoFile.id,
    title: videoFile.title
  }
}

function extractVimeoId(url: string): string | null {
  // Handle various Vimeo URL formats
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /vimeo\.com\/video\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }
  
  return null
}

async function fetchVimeoVideoData(vimeoId: string): Promise<any> {
  try {
    if (!process.env.VIMEO_ACCESS_TOKEN) {
      throw new Error('Vimeo access token not configured')
    }

    const response = await fetch(`https://api.vimeo.com/videos/${vimeoId}`, {
      headers: {
        'Authorization': `bearer ${process.env.VIMEO_ACCESS_TOKEN}`,
        'Accept': 'application/vnd.vimeo.*+json;version=3.4'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Video not found on Vimeo')
      }
      throw new Error(`Vimeo API error: ${response.status}`)
    }

    const vimeoData = await response.json()
    
    return {
      name: vimeoData.name || 'Untitled Video',
      description: vimeoData.description || '',
      uri: vimeoData.uri,
      duration: vimeoData.duration || 0,
      pictures: vimeoData.pictures
    }
  } catch (error) {
    console.error('Error fetching Vimeo video data:', error)
    throw error
  }
}

async function getOrCreateCategory(supabase: any, categoryName: string): Promise<string | null> {
  // First try to find existing category
  const { data: existingCategory } = await supabase
    .from('video_categories')
    .select('id')
    .eq('name', categoryName.trim())
    .single()

  if (existingCategory) {
    return existingCategory.id
  }

  // Create new category
  const { data: newCategory, error } = await supabase
    .from('video_categories')
    .insert({
      name: categoryName.trim(),
      description: null,
      thumbnail_url: null,
      thumbnail_source: 'default',
      thumbnail_color: '#3b82f6'
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating category:', error)
    return null
  }

  return newCategory.id
}

async function getOrCreateSubcategory(supabase: any, subcategoryName: string, categoryId: string): Promise<string | null> {
  // First try to find existing subcategory
  const { data: existingSubcategory } = await supabase
    .from('video_subcategories')
    .select('id')
    .eq('name', subcategoryName.trim())
    .eq('video_category_id', categoryId)
    .single()

  if (existingSubcategory) {
    return existingSubcategory.id
  }

  // Create new subcategory
  const { data: newSubcategory, error } = await supabase
    .from('video_subcategories')
    .insert({
      name: subcategoryName.trim(),
      description: null,
      video_category_id: categoryId,
      thumbnail_url: null,
      thumbnail_source: 'default',
      thumbnail_color: '#3b82f6'
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating subcategory:', error)
    return null
  }

  return newSubcategory.id
}