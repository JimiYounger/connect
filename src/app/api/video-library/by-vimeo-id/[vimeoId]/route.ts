import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vimeoId: string }> }
) {
  try {
    const supabase = await createClient()
    const { vimeoId } = await params

    // Get the video by vimeo_id
    const { data: video, error } = await supabase
      .from('video_files')
      .select('id, title')
      .eq('vimeo_id', vimeoId)
      .single()

    if (error) {
      console.error('Error fetching video by Vimeo ID:', error)
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(video)
  } catch (error) {
    console.error('Error in by-vimeo-id API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 