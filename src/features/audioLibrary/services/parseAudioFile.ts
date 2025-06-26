import { createClient } from '@/lib/supabase-server'
import OpenAI from 'openai'
import { v4 as uuidv4 } from 'uuid'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Maximum chunk size in characters
const MAX_CHUNK_SIZE = 800

/**
 * Helper function to get an audio file with retries to handle eventual consistency
 */
async function getAudioFileWithRetry(
  supabase: any, 
  audioFileId: string, 
  maxRetries = 5, 
  delayMs = 300
) {
  let retries = 0;
  
  while (retries < maxRetries) {
    // Use maybeSingle() instead of single() to avoid throwing errors
    const { data: audioFile, error } = await supabase
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
      .eq('id', audioFileId)
      .maybeSingle();
      
    if (audioFile) {
      console.log(`🔍 Successfully found audio file on attempt ${retries + 1}`)
      return { data: audioFile, error: null };
    }
    
    // If we're not at the max retries yet, wait and try again
    if (retries < maxRetries - 1) {
      retries++;
      console.log(`🕒 [Retry ${retries}/${maxRetries}] Waiting for audio_file_id to be available...`);
      
      // Wait for delayMs before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } else {
      // We've exhausted our retries
      console.log(`❌ Failed to find audio file after ${maxRetries} attempts.`);
      return { data: null, error: error || new Error(`Audio file not found after ${maxRetries} retries`) };
    }
  }
  
  // This should never be reached but TypeScript wants it
  return { data: null, error: new Error('Unexpected end of retry loop') };
}

/**
 * Updates the audio file status to 'failed' in case of errors
 */
async function updateStatusToFailed(supabase: any, audioFileId: string) {
  try {
    console.log(`Updating embedding_status to 'failed' for audioFileId: ${audioFileId}`)
    const { error: updateError } = await supabase
      .from('audio_files')
      .update({ embedding_status: 'failed' })
      .eq('id', audioFileId)
    
    if (updateError) {
      console.log(`Failed to update embedding_status to 'failed'. Error: ${JSON.stringify(updateError)}`)
    } else {
      console.log(`Successfully updated embedding_status to 'failed'`)
    }
  } catch (error) {
    console.error('Error updating status to failed:', error)
  }
}

/**
 * Converts transcription segments to database chunks
 */
function segmentsToChunks(segments: any[], audioFileId: string) {
  console.log(`segmentsToChunks called with ${segments.length} segments for audioFileId: ${audioFileId}`)
  
  if (!segments.length) {
    // If no segments are available, create a single chunk with the entire transcript
    console.log(`No segments available, creating single empty chunk`)
    const emptyChunk = {
      id: uuidv4(),
      audio_file_id: audioFileId,
      chunk_index: 0,
      start_time: 0,
      end_time: 0, // We don't know the end time
      content: segments.map(s => s.text).join(' '),
      created_at: new Date().toISOString()
    };
    return [emptyChunk]
  }

  console.log(`Starting chunking process with MAX_CHUNK_SIZE: ${MAX_CHUNK_SIZE}`)
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
    const potentialLength = (currentChunk.text + ' ' + segment.text).length;
    if (potentialLength > MAX_CHUNK_SIZE && currentChunk.text.length > 0) {
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
  const dbChunks = chunks.map((chunk, index) => ({
    id: uuidv4(),
    audio_file_id: audioFileId,
    chunk_index: index,
    start_time: chunk.start_time,
    end_time: chunk.end_time,
    content: chunk.text,
    created_at: new Date().toISOString()
  }));
  
  return dbChunks
}

/**
 * Interface for audio file details
 */
interface AudioFileDetails {
  audio_file_id: string;
  file_path: string;
  file_type: string;
  title: string;
  version_id?: string; // Optional since we don't always need it
}

/**
 * Backward compatibility function to support old signature
 * @deprecated Use the version that accepts full AudioFileDetails object instead
 */
export async function parseAudioFile(audioFileId: string): Promise<{success: boolean, chunkCount?: number, error?: string}>;

/**
 * Main function to parse an audio file
 * - Downloads the audio file from Supabase Storage using provided metadata
 * - Transcribes it with OpenAI Whisper
 * - Chunks the content
 * - Stores transcripts and chunks in Supabase
 * - Triggers the embedding generation Edge Function
 */
export async function parseAudioFile(audioDetailsOrId: AudioFileDetails): Promise<{success: boolean, chunkCount?: number, error?: string}>;

/**
 * Implementation signature that handles both overloads
 */
export async function parseAudioFile(
  audioDetailsOrId: AudioFileDetails | string
): Promise<{success: boolean, chunkCount?: number, error?: string}> {
  // Create Supabase client
  const supabase = await createClient()
  
  // Handle both function signatures
  let audioFileId: string;
  let filePath: string | null = null;
  let fileType: string | null = null;
  let title: string | null = null;
  
  // Determine if we're using the new or old signature
  if (typeof audioDetailsOrId === 'string') {
    // Legacy string parameter (just the ID)
    audioFileId = audioDetailsOrId;
    console.log(`[parseAudioFile] Starting to process audio_file_id: ${audioFileId} (legacy mode)`)
    
    // We need to fetch the audio file details the old way
    console.log(`🔍 Fetching audio file details for id: ${audioFileId} with retry mechanism`)
    const { data: audioFile, error: audioFileError } = await getAudioFileWithRetry(
      supabase, 
      audioFileId
    )

    if (audioFileError || !audioFile) {
      console.error('Error fetching audio file:', audioFileError)
      return { success: false, error: 'Audio file not found after multiple retries' }
    }
    
    // Extract details from the fetched file
    title = audioFile.title;
    console.log(`🔍 Successfully retrieved audio file: ${audioFile.id}, title: ${title}`)
    
    // Get the audio version details
    const audioVersion = audioFile.audio_versions[0]
    if (!audioVersion) {
      console.error('No audio version found for file:', audioFileId)
      await updateStatusToFailed(supabase, audioFileId)
      return { success: false, error: 'No audio version found' }
    }
    
    filePath = audioVersion.file_path;
    fileType = audioVersion.file_type;
    console.log(`Found audio version: id=${audioVersion.id}, file_path=${filePath}, type=${fileType}`)
  } else {
    // New object parameter with all details
    const { audio_file_id, file_path, file_type, title: fileTitle } = audioDetailsOrId;
    audioFileId = audio_file_id;
    filePath = file_path;
    fileType = file_type;
    title = fileTitle;
    
    console.log(`[parseAudioFile] Starting to process audio_file_id: ${audioFileId}, title: ${title}`)
    
    // Validate input
    if (!audioFileId || !filePath || !fileType) {
      console.error('Missing required audio details')
      return { success: false, error: 'Audio file ID, file path, and file type are required' }
    }
    
    console.log(`🔍 Using provided audio data: path=${filePath}, type=${fileType}`)
  }

  // Additional null safety checks
  if (!filePath) {
    console.error('File path is null or undefined')
    await updateStatusToFailed(supabase, audioFileId)
    return { success: false, error: 'File path is required' }
  }

  if (!fileType) {
    console.error('File type is null or undefined')
    await updateStatusToFailed(supabase, audioFileId)
    return { success: false, error: 'File type is required' }
  }

  try {
    // Update the embedding_status to 'processing'
    console.log(`Updating embedding_status to 'processing' for file: ${audioFileId}`)
    const { error: statusUpdateError } = await supabase
      .from('audio_files')
      .update({ embedding_status: 'processing' })
      .eq('id', audioFileId)
      
    if (statusUpdateError) {
      console.log(`Failed to update embedding_status to 'processing'. Error: ${JSON.stringify(statusUpdateError)}`)
    }
    
    // Download the audio file from Supabase storage
    console.log(`Attempting to download audio file from storage: ${filePath}`)
    const { data: audioFileData, error: downloadError } = await supabase
      .storage
      .from('audio-library')
      .download(filePath)

    if (downloadError || !audioFileData) {
      console.error('Error downloading audio file:', downloadError)
      await updateStatusToFailed(supabase, audioFileId)
      return { success: false, error: 'Failed to download audio file' }
    }
    console.log(`Successfully downloaded audio file. Size: ${audioFileData.size} bytes`)

    // Convert Blob to File object which implements the Uploadable interface required by OpenAI
    const fileName = filePath.split('/').pop() || 'audio.mp3'
    console.log(`Creating File object with name: ${fileName}, type: ${fileType}`)
    const fileObj = new File([audioFileData], fileName, { 
      type: fileType 
    })
    
    // Transcribe the audio using Whisper API
    console.log(`Initiating OpenAI transcription request with model: whisper-1`)
    let transcription
    try {
      transcription = await openai.audio.transcriptions.create({
        file: fileObj,
        model: 'whisper-1',
        language: 'en',
        response_format: 'verbose_json'
      })
      console.log(`OpenAI transcription successful. Received transcript of length: ${transcription.text.length}`)
    } catch (error) {
      console.error('Error transcribing audio:', error)
      await updateStatusToFailed(supabase, audioFileId)
      return { success: false, error: 'Failed to transcribe audio' }
    }

    // Extract transcript and segments with defensive check
    const fullTranscript = transcription.text
    const segments = transcription.segments ?? []
    console.log(`Extracted transcript of length: ${fullTranscript.length} and ${segments.length} segments`)

    // Create the transcript record
    const transcriptId = uuidv4()
    console.log(`Inserting transcript with ID: ${transcriptId} for audio_file_id: ${audioFileId}`)
    const { error: transcriptError } = await supabase
      .from('audio_transcripts')
      .insert({
        id: transcriptId,
        audio_file_id: audioFileId,
        content: fullTranscript,
        created_at: new Date().toISOString()
      })

    if (transcriptError) {
      console.error('Error creating transcript:', transcriptError)
      await updateStatusToFailed(supabase, audioFileId)
      return { success: false, error: 'Failed to save transcript' }
    }

    // Generate chunks from the segments
    console.log(`Generating chunks from ${segments.length} segments`)
    const chunks = segmentsToChunks(segments, audioFileId)
    console.log(`Generated ${chunks.length} chunks from segments`)

    // Insert the chunks into the database
    console.log(`Inserting ${chunks.length} chunks into audio_chunks table`)
    const { error: chunksError } = await supabase
      .from('audio_chunks')
      .insert(chunks)

    if (chunksError) {
      console.error('Error creating chunks:', chunksError)
      await updateStatusToFailed(supabase, audioFileId)
      return { success: false, error: 'Failed to save audio chunks' }
    }

    // Update the audio file status to 'pending' for embedding
    console.log(`Updating embedding_status to 'pending' for audio_file_id: ${audioFileId}`)
    const { error: pendingUpdateError } = await supabase
      .from('audio_files')
      .update({ embedding_status: 'pending' })
      .eq('id', audioFileId)
      
    if (pendingUpdateError) {
      console.log(`Failed to update embedding_status to 'pending'. Error: ${JSON.stringify(pendingUpdateError)}`)
    }

    // Trigger Supabase Edge Function for embedding generation
    console.log(`Attempting to trigger Supabase Edge Function for embedding generation`)
    try {
      const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-audio-embeddings`;
      console.log(`Edge function URL: ${edgeFunctionUrl}`);
      
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ audioFileId: audioFileId })
      });
      
      if (!response.ok) {
        const responseText = await response.text();
        console.log(`Edge function error response: ${responseText}`);
      } else {
        console.log(`Successfully triggered embedding generation for audioFileId=${audioFileId}`);
      }
    } catch (err) {
      console.error('Failed to trigger audio embedding function:', err);
      // Continue even if edge function call fails
    }

    console.log(`Audio parse process COMPLETED SUCCESSFULLY for ID: ${audioFileId}`)
    return {
      success: true,
      chunkCount: chunks.length
    }
  } catch (error) {
    console.error('Error in parseAudioFile:', error)
    await updateStatusToFailed(supabase, audioFileId)
    return { 
      success: false, 
      error: `Internal error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}