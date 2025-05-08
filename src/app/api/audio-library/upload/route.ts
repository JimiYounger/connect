import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import type { UploadAudioRequest } from '@/features/audioLibrary/types'

export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const requestData: UploadAudioRequest = await request.json()

    const { 
      title, 
      description, 
      audio_series_id, 
      file_url, 
      file_type, 
      user_id 
    } = requestData

    // Use the stored procedure to create the audio file and version
    const { data, error } = await supabase.rpc('create_audio_file_with_version', {
      p_title: title,
      p_description: description || null,
      p_audio_series_id: audio_series_id || null,
      p_created_by: user_id,
      p_file_path: file_url,
      p_file_type: file_type
    })

    if (error) {
      console.error('Error creating audio file with version:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to upload audio file' },
        { status: 500 }
      )
    }

    // Type assertion to handle the unknown data type
    const responseData = data as { audio_file_id: string; version_id: string }
    const audioFileId = responseData.audio_file_id

    // Trigger audio file parsing
    try {
      await fetch(new URL('/api/audio-library/parse', request.url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio_file_id: audioFileId }),
      })
    } catch (parseError) {
      console.error('Error triggering parse endpoint:', parseError)
      // Continue execution even if parse trigger fails
      // The audio file is already saved in the database
    }

    return NextResponse.json({
      success: true,
      audioFileId,
    })
  } catch (error) {
    console.error('Error in audio upload API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}