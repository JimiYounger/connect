// my-app/src/app/api/audio-library/upload/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import type { UploadAudioRequest } from '@/features/audioLibrary/types'
import { parseAudioFile } from '@/features/audioLibrary/services/parseAudioFile'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const requestData: UploadAudioRequest = await request.json()

    const { 
      title, 
      description, 
      audio_series_id, 
      file_url, 
      file_path, // Add the internal storage path
      file_type, 
      user_id 
    } = requestData

    // Get the actual user profile ID from the user_profiles table
    // since the auth.uid() might be different from the profile ID
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user_id)
      .single();
      
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { success: false, error: `Failed to get user profile: ${profileError.message}` },
        { status: 500 }
      );
    }
    
    // Get the profile ID to use as created_by
    const userId = profileData?.id || user_id;
    
    // Log the parameters for debugging
    console.log('Function parameters:', {
      p_title: title,
      p_description: description,
      p_audio_series_id: audio_series_id,
      p_created_by: userId,
      p_file_url: file_url,
      p_file_path: file_path, // Log the internal storage path
      p_file_type: file_type
    });
    
    // Use the stored procedure to create the audio file and version
    const { data, error } = await supabase.rpc('create_audio_file_with_version', {
      p_title: title,
      p_description: description || null,
      p_audio_series_id: audio_series_id || null,
      p_created_by: userId,
      p_file_path: file_path, // Use the internal storage path instead of public URL
      p_file_type: file_type
    })

    console.log('Function result:', { data, error })

    if (error) {
      console.error('Error creating audio file with version:', error)
      return NextResponse.json(
        { success: false, error: `Failed to upload audio file: ${error.message}` },
        { status: 500 }
      )
    }

    // Type assertion to handle the unknown data type
    const responseData = data as { 
      audio_file_id: string; 
      version_id: string;
      file_path: string;
      file_type: string;
      title: string;
      success: boolean;
    } | null
    
    const audioFileId = responseData?.audio_file_id || 'unknown-id'

    // Process audio file using our helper function
    try {
      console.log(`🔍 Processing audio file with ID: ${audioFileId}`)
      
      // Even if the RPC returns file_path, prioritize the one from the request
      // as it's the properly formatted internal path from Supabase Storage
      if (responseData && file_path && file_type) {
        // Call the parseAudioFile helper function with all available metadata
        console.log(`🔍 Using direct metadata for parsing: ${JSON.stringify({
          audio_file_id: responseData.audio_file_id,
          file_path: file_path, // Use the path we received from the client
          file_type: file_type,
          title: responseData.title || title
        })}`)
        
        const parseResult = await parseAudioFile({
          audio_file_id: responseData.audio_file_id,
          file_path: file_path, // Use the path we received from the client
          file_type: file_type,
          title: responseData.title || title,
          version_id: responseData.version_id
        })
        
        if (!parseResult.success) {
          console.log(`🔍 Audio processing failed: ${parseResult.error}`)
          // Continue execution even if processing fails
          // The audio file is already saved in the database
        } else {
          console.log(`🔍 Audio processing successful. Generated ${parseResult.chunkCount} chunks.`)
        }
      } else {
        // Fall back to legacy method if we don't have complete file metadata
        console.log(`🔍 Missing complete file metadata, falling back to ID-only method`)
        const parseResult = await parseAudioFile(audioFileId)
        
        if (!parseResult.success) {
          console.log(`🔍 Audio processing failed: ${parseResult.error}`)
        } else {
          console.log(`🔍 Audio processing successful. Generated ${parseResult.chunkCount} chunks.`)
        }
      }
    } catch (parseError) {
      console.error('Error processing audio file:', parseError)
      // Continue execution even if processing fails
      // The audio file is already saved in the database
    }

    return NextResponse.json({
      success: true,
      audioFileId: audioFileId,
    })
  } catch (error) {
    console.error('Error in audio upload API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}