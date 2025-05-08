import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import OpenAI from 'openai'
import { v4 as uuidv4 } from 'uuid'
import type { ParseAudioRequest, ParseAudioResponse } from '@/features/audioLibrary/types'

export const runtime = 'edge'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Maximum chunk size in characters
const MAX_CHUNK_SIZE = 800

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const requestData: ParseAudioRequest = await request.json()
    const { audio_file_id } = requestData

    // Validate input
    if (!audio_file_id) {
      return NextResponse.json(
        { success: false, error: 'Audio file ID is required' },
        { status: 400 }
      )
    }

    // Get the audio file details with its current version
    const { data: audioFile, error: audioFileError } = await supabase
      .from('audio_files')
      .select(`
        id,
        title,
        audio_versions!inner (
          id,
          file_path,
          file_type
        )
      `)
      .eq('id', audio_file_id)
      .single()

    if (audioFileError || !audioFile) {
      console.error('Error fetching audio file:', audioFileError)
      return NextResponse.json(
        { success: false, error: 'Audio file not found' },
        { status: 404 }
      )
    }

    // Update the embedding_status to 'processing'
    await supabase
      .from('audio_files')
      .update({ embedding_status: 'processing' })
      .eq('id', audio_file_id)

    // Get the audio version details
    const audioVersion = audioFile.audio_versions[0]
    if (!audioVersion) {
      console.error('No audio version found for file:', audio_file_id)
      await updateStatusToFailed(supabase, audio_file_id)
      return NextResponse.json(
        { success: false, error: 'No audio version found' },
        { status: 500 }
      )
    }

    // Download the audio file from Supabase storage
    const { data: audioFileData, error: downloadError } = await supabase
      .storage
      .from('audio-library')
      .download(audioVersion.file_path)

    if (downloadError || !audioFileData) {
      console.error('Error downloading audio file:', downloadError)
      await updateStatusToFailed(supabase, audio_file_id)
      return NextResponse.json(
        { success: false, error: 'Failed to download audio file' },
        { status: 500 }
      )
    }

    // Convert Blob to File object which implements the Uploadable interface required by OpenAI
    const fileName = audioVersion.file_path.split('/').pop() || 'audio.mp3'
    const fileObj = new File([audioFileData], fileName, { 
      type: audioVersion.file_type 
    })

    // Transcribe the audio using Whisper API
    let transcription
    try {
      transcription = await openai.audio.transcriptions.create({
        file: fileObj,
        model: 'whisper-1',
        language: 'en',
        response_format: 'verbose_json'
      })
    } catch (error) {
      console.error('Error transcribing audio:', error)
      await updateStatusToFailed(supabase, audio_file_id)
      return NextResponse.json(
        { success: false, error: 'Failed to transcribe audio' },
        { status: 500 }
      )
    }

    // Extract transcript and segments with defensive check
    const fullTranscript = transcription.text
    const segments = transcription.segments ?? []

    // Create the transcript record
    const transcriptId = uuidv4()
    const { error: transcriptError } = await supabase
      .from('audio_transcripts')
      .insert({
        id: transcriptId,
        audio_file_id,
        content: fullTranscript, // Changed from full_transcript to content
        created_at: new Date().toISOString()
      })

    if (transcriptError) {
      console.error('Error creating transcript:', transcriptError)
      await updateStatusToFailed(supabase, audio_file_id)
      return NextResponse.json(
        { success: false, error: 'Failed to save transcript' },
        { status: 500 }
      )
    }

    // Generate chunks from the segments
    const chunks = segmentsToChunks(segments, audio_file_id)

    // Insert the chunks into the database
    const { error: chunksError } = await supabase
      .from('audio_chunks')
      .insert(chunks)

    if (chunksError) {
      console.error('Error creating chunks:', chunksError)
      await updateStatusToFailed(supabase, audio_file_id)
      return NextResponse.json(
        { success: false, error: 'Failed to save audio chunks' },
        { status: 500 }
      )
    }

    // Update the audio file status to 'pending' for embedding
    await supabase
      .from('audio_files')
      .update({ embedding_status: 'pending' })
      .eq('id', audio_file_id)

    // Trigger Supabase Edge Function for embedding generation
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-audio-embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ audioFileId: audio_file_id })
      });
      console.log(`🎯 Triggered embedding generation for audioFileId=${audio_file_id}`);
    } catch (err) {
      console.error('❌ Failed to trigger audio embedding function:', err);
    }

    // Return success response
    const response: ParseAudioResponse = {
      success: true,
      chunkCount: chunks.length
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in audio parse API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to update status to failed
async function updateStatusToFailed(supabase: any, audioFileId: string) {
  try {
    await supabase
      .from('audio_files')
      .update({ embedding_status: 'failed' })
      .eq('id', audioFileId)
  } catch (error) {
    console.error('Error updating status to failed:', error)
  }
}

// Helper function to convert segments to chunks
function segmentsToChunks(segments: any[], audioFileId: string) {
  if (!segments.length) {
    // If no segments are available, create a single chunk with the entire transcript
    return [{
      id: uuidv4(),
      audio_file_id: audioFileId,
      chunk_index: 0,
      start_time: 0,
      end_time: 0, // We don't know the end time
      content: segments.map(s => s.text).join(' '),
      created_at: new Date().toISOString()
    }]
  }

  const chunks = []
  let currentChunk = {
    text: '',
    start_time: segments[0].start,
    end_time: segments[0].end,
    segments: [] as any[]
  }

  // Group segments into chunks of appropriate size
  for (const segment of segments) {
    // If adding this segment would exceed max size, finish current chunk and start a new one
    if ((currentChunk.text + ' ' + segment.text).length > MAX_CHUNK_SIZE && currentChunk.text.length > 0) {
      chunks.push(currentChunk)
      currentChunk = {
        text: segment.text,
        start_time: segment.start,
        end_time: segment.end,
        segments: [segment]
      }
    } else {
      // Add segment to current chunk
      currentChunk.text += (currentChunk.text ? ' ' : '') + segment.text
      currentChunk.end_time = segment.end
      currentChunk.segments.push(segment)
    }
  }

  // Add the last chunk if it has content
  if (currentChunk.text.length > 0) {
    chunks.push(currentChunk)
  }

  // Convert chunks to the database format
  return chunks.map((chunk, index) => ({
    id: uuidv4(),
    audio_file_id: audioFileId,
    chunk_index: index,
    start_time: chunk.start_time,
    end_time: chunk.end_time,
    content: chunk.text,
    created_at: new Date().toISOString()
  }))
}