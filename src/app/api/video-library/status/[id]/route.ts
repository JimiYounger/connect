import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoFileId } = await params

    if (!videoFileId) {
      return NextResponse.json(
        { success: false, error: 'Video file ID is required' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get video file status
    const { data: videoFile, error: videoError } = await supabase
      .from('video_files')
      .select('*')
      .eq('id', videoFileId)
      .single()

    if (videoError || !videoFile) {
      return NextResponse.json(
        { success: false, error: 'Video file not found' },
        { status: 404 }
      )
    }

    // Get transcript status
    const { data: transcript, error: transcriptError } = await supabase
      .from('video_transcripts')
      .select('*')
      .eq('video_file_id', videoFileId)
      .single()

    // Get chunks count
    const { count: chunksCount, error: _chunksError } = await supabase
      .from('video_chunks')
      .select('*', { count: 'exact' })
      .eq('video_file_id', videoFileId)

    // Determine transcript status
    let transcriptStatus = 'pending'
    if (transcript) {
      transcriptStatus = 'completed'
    } else if (transcriptError && transcriptError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected if transcript isn't created yet
      transcriptStatus = 'failed'
    }

    // Determine embedding status from video file
    const embeddingStatus = videoFile.embedding_status || 'pending'

    return NextResponse.json({
      success: true,
      videoFileId,
      transcriptStatus,
      embeddingStatus,
      chunksCount: chunksCount || 0,
      videoFile: {
        title: videoFile.title,
        description: videoFile.description,
        vimeo_id: videoFile.vimeo_id,
        library_status: videoFile.library_status,
        transcript_status: videoFile.transcript_status,
        embedding_status: videoFile.embedding_status,
        summary_status: videoFile.summary_status,
        created_at: videoFile.created_at,
        updated_at: videoFile.updated_at
      }
    })

  } catch (error) {
    console.error('Error checking video status:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Status check failed' 
      },
      { status: 500 }
    )
  }
}