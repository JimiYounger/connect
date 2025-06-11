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
 * Helper function to get a video file with retries to handle eventual consistency
 */
async function getVideoFileWithRetry(
  supabase: any, 
  videoFileId: string, 
  maxRetries = 5, 
  delayMs = 300
) {
  let retries = 0;
  
  while (retries < maxRetries) {
    const { data: videoFile, error } = await supabase
      .from('video_files')
      .select(`
        id,
        title,
        vimeo_id,
        vimeo_uri,
        vimeo_duration,
        vimeo_metadata
      `)
      .eq('id', videoFileId)
      .maybeSingle();
      
    if (videoFile) {
      console.log(`🔍 Successfully found video file on attempt ${retries + 1}`)
      return { data: videoFile, error: null };
    }
    
    if (retries < maxRetries - 1) {
      retries++;
      console.log(`🕒 [Retry ${retries}/${maxRetries}] Waiting for video_file_id to be available...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } else {
      console.log(`❌ Failed to find video file after ${maxRetries} attempts.`);
      return { data: null, error: error || new Error(`Video file not found after ${maxRetries} retries`) };
    }
  }
  
  return { data: null, error: new Error('Unexpected end of retry loop') };
}

/**
 * Updates the video file status to 'failed' in case of errors
 */
async function updateStatusToFailed(supabase: any, videoFileId: string, statusType: 'transcript' | 'embedding' | 'summary') {
  try {
    const statusField = `${statusType}_status`;
    console.log(`Updating ${statusField} to 'failed' for videoFileId: ${videoFileId}`)
    const { error: updateError } = await supabase
      .from('video_files')
      .update({ [statusField]: 'failed' })
      .eq('id', videoFileId)
    
    if (updateError) {
      console.log(`Failed to update ${statusField} to 'failed'. Error: ${JSON.stringify(updateError)}`)
    } else {
      console.log(`Successfully updated ${statusField} to 'failed'`)
    }
  } catch (error) {
    console.error(`Error updating ${statusType} status to failed:`, error)
  }
}

/**
 * Converts transcript text to time-stamped chunks
 */
function transcriptToChunks(transcriptText: string, videoFileId: string, videoDuration?: number) {
  console.log(`transcriptToChunks called with transcript length: ${transcriptText.length} for videoFileId: ${videoFileId}`)
  
  if (!transcriptText || transcriptText.trim() === '') {
    console.log(`Empty transcript, creating single empty chunk`)
    const emptyChunk = {
      id: uuidv4(),
      video_file_id: videoFileId,
      chunk_index: 0,
      timestamp_start: 0,
      timestamp_end: videoDuration || 0,
      content: '',
      created_at: new Date().toISOString()
    };
    return [emptyChunk]
  }

  console.log(`Starting chunking process with MAX_CHUNK_SIZE: ${MAX_CHUNK_SIZE}`)
  
  // Improved text splitting - handle different punctuation and word boundaries
  const words = transcriptText.split(/\s+/).filter(w => w.trim().length > 0);
  const chunks = []
  let currentChunk = '';
  let currentWordIndex = 0;
  let chunkIndex = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const potentialChunk = currentChunk ? `${currentChunk} ${word}` : word;
    
    if (potentialChunk.length > MAX_CHUNK_SIZE && currentChunk.length > 0) {
      // Finish current chunk
      const chunkStartRatio = currentWordIndex / words.length;
      const chunkEndRatio = i / words.length;
      
      const startTime = videoDuration ? chunkStartRatio * videoDuration : chunkIndex * 30;
      const endTime = videoDuration ? chunkEndRatio * videoDuration : (chunkIndex + 1) * 30;
      
      chunks.push({
        id: uuidv4(),
        video_file_id: videoFileId,
        video_transcript_id: null, // Will be set after transcript is created
        chunk_index: chunkIndex,
        start_time: Math.round(startTime * 100) / 100, // Round to 2 decimal places
        end_time: Math.round(endTime * 100) / 100,
        content: currentChunk.trim(),
        created_at: new Date().toISOString()
      });
      
      // Start new chunk
      currentChunk = word;
      currentWordIndex = i;
      chunkIndex++;
    } else {
      // Add to current chunk
      currentChunk = potentialChunk;
    }
  }

  // Add the last chunk if it has content
  if (currentChunk.trim().length > 0) {
    const chunkStartRatio = currentWordIndex / words.length;
    const startTime = videoDuration ? chunkStartRatio * videoDuration : chunkIndex * 30;
    const endTime = videoDuration || (chunkIndex + 1) * 30;
    
    chunks.push({
      id: uuidv4(),
      video_file_id: videoFileId,
      video_transcript_id: null, // Will be set after transcript is created
      chunk_index: chunkIndex,
      start_time: Math.round(startTime * 100) / 100,
      end_time: Math.round(endTime * 100) / 100,
      content: currentChunk.trim(),
      created_at: new Date().toISOString()
    });
  }
  
  console.log(`Generated ${chunks.length} chunks from transcript`)
  return chunks;
}

/**
 * Extract transcript from Vimeo video using Text Tracks API
 */
async function extractVimeoTranscript(vimeoId: string): Promise<string | null> {
  try {
    if (!process.env.VIMEO_ACCESS_TOKEN) {
      console.log('No Vimeo access token available for transcript extraction')
      return null;
    }

    console.log(`Attempting to extract transcript from Vimeo ID: ${vimeoId}`)

    // Step 1: Get available text tracks
    const textTracksResponse = await fetch(`https://api.vimeo.com/videos/${vimeoId}/texttracks`, {
      headers: {
        'Authorization': `bearer ${process.env.VIMEO_ACCESS_TOKEN}`,
        'Accept': 'application/vnd.vimeo.*+json;version=3.4'
      }
    });

    if (!textTracksResponse.ok) {
      console.log(`No text tracks available for video ${vimeoId}: ${textTracksResponse.status}`)
      return null;
    }

    const textTracksData = await textTracksResponse.json();
    
    if (!textTracksData.data || textTracksData.data.length === 0) {
      console.log(`No text tracks found for video ${vimeoId}`)
      return null;
    }

    // Step 2: Find the best text track (prefer English, then any language)
    let selectedTrack = textTracksData.data.find((track: any) => 
      track.language === 'en' || track.language === 'en-US'
    ) || textTracksData.data[0];

    if (!selectedTrack || !selectedTrack.link) {
      console.log(`No usable text track found for video ${vimeoId}`)
      return null;
    }

    console.log(`Found text track: ${selectedTrack.name} (${selectedTrack.language})`)

    // Step 3: Download the transcript content
    const transcriptResponse = await fetch(selectedTrack.link, {
      headers: {
        'Authorization': `bearer ${process.env.VIMEO_ACCESS_TOKEN}`,
      }
    });

    if (!transcriptResponse.ok) {
      console.log(`Failed to download transcript for video ${vimeoId}: ${transcriptResponse.status}`)
      return null;
    }

    const transcriptContent = await transcriptResponse.text();
    
    // Step 4: Parse transcript based on format
    let extractedText = '';
    
    if (selectedTrack.type === 'captions' || transcriptContent.includes('WEBVTT')) {
      // Parse WebVTT format
      extractedText = parseWebVTT(transcriptContent);
    } else if (transcriptContent.includes('<transcript>') || transcriptContent.includes('<?xml')) {
      // Parse XML transcript format
      extractedText = parseXMLTranscript(transcriptContent);
    } else {
      // Assume plain text
      extractedText = transcriptContent.trim();
    }

    if (extractedText && extractedText.length > 10) {
      console.log(`Successfully extracted transcript: ${extractedText.length} characters`)
      return extractedText;
    } else {
      console.log(`Transcript content too short or empty for video ${vimeoId}`)
      return null;
    }

  } catch (error) {
    console.error(`Error extracting transcript for video ${vimeoId}:`, error);
    return null;
  }
}

/**
 * Parse WebVTT caption format to extract text
 */
function parseWebVTT(content: string): string {
  const lines = content.split('\n');
  const textLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip WebVTT headers, timestamps, and empty lines
    if (line === '' || 
        line === 'WEBVTT' || 
        line.includes('-->') || 
        line.match(/^\d+$/)) {
      continue;
    }
    
    // Remove HTML tags and add text
    const cleanText = line.replace(/<[^>]*>/g, '').trim();
    if (cleanText) {
      textLines.push(cleanText);
    }
  }
  
  return textLines.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Parse XML transcript format to extract text
 */
function parseXMLTranscript(content: string): string {
  // Simple XML parsing - extract text between tags
  const textMatches = content.match(/>([^<]+)</g);
  if (!textMatches) return '';
  
  const textLines = textMatches
    .map(match => match.slice(1, -1).trim())
    .filter(text => text && !text.match(/^\d+$/));
  
  return textLines.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Generate summary for video content using OpenAI
 */
async function generateVideoSummary(title: string, description: string, transcriptText: string): Promise<string> {
  try {
    const content = `
Title: ${title}
Description: ${description || 'No description available'}
Transcript: ${transcriptText.substring(0, 3000)}${transcriptText.length > 3000 ? '...' : ''}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates concise, informative summaries of video content. Focus on the main topics, key points, and actionable insights.'
        },
        {
          role: 'user',
          content: `Please create a concise summary (2-3 paragraphs) of this video content:\n\n${content}`
        }
      ],
      max_tokens: 300,
      temperature: 0.3
    });

    return response.choices[0]?.message?.content || 'Summary could not be generated';
  } catch (error) {
    console.error('Error generating video summary:', error);
    throw error;
  }
}

/**
 * Interface for video file details
 */
interface VideoFileDetails {
  video_file_id: string;
  title: string;
  description?: string;
  vimeo_id?: string;
  vimeo_duration?: number;
}

/**
 * Main function to process a video file
 * - Extracts transcript from Vimeo video
 * - Chunks the content with timestamps
 * - Stores transcripts and chunks in Supabase
 * - Generates video summary
 * - Triggers the embedding generation Edge Function
 */
export async function processVideoFile(
  videoDetailsOrId: VideoFileDetails | string
): Promise<{success: boolean, chunkCount?: number, error?: string}> {
  // Create Supabase client
  const supabase = await createClient()
  
  // Handle both function signatures
  let videoFileId: string;
  let title: string | null = null;
  let description: string | null = null;
  let vimeoId: string | null = null;
  let vimeoDuration: number | null = null;
  
  // Determine if we're using the new or old signature
  if (typeof videoDetailsOrId === 'string') {
    // Legacy string parameter (just the ID)
    videoFileId = videoDetailsOrId;
    console.log(`[processVideoFile] Starting to process video_file_id: ${videoFileId} (legacy mode)`)
    
    // Fetch the video file details
    console.log(`🔍 Fetching video file details for id: ${videoFileId} with retry mechanism`)
    const { data: videoFile, error: videoFileError } = await getVideoFileWithRetry(
      supabase, 
      videoFileId
    )

    if (videoFileError || !videoFile) {
      console.error('Error fetching video file:', videoFileError)
      return { success: false, error: 'Video file not found after multiple retries' }
    }
    
    // Extract details from the fetched file
    title = videoFile.title;
    description = videoFile.description;
    vimeoId = videoFile.vimeo_id;
    vimeoDuration = videoFile.vimeo_duration;
    console.log(`🔍 Successfully retrieved video file: ${videoFile.id}, title: ${title}`)
  } else {
    // New object parameter with all details
    const { video_file_id, title: fileTitle, description: fileDesc, vimeo_id, vimeo_duration } = videoDetailsOrId;
    videoFileId = video_file_id;
    title = fileTitle;
    description = fileDesc;
    vimeoId = vimeo_id;
    vimeoDuration = vimeo_duration;
    
    console.log(`[processVideoFile] Starting to process video_file_id: ${videoFileId}, title: ${title}`)
    
    // Validate input
    if (!videoFileId) {
      console.error('Missing required video file ID')
      return { success: false, error: 'Video file ID is required' }
    }
    
    console.log(`🔍 Using provided video data: vimeoId=${vimeoId}, duration=${vimeoDuration}`)
  }

  try {
    // Update the transcript_status to 'processing'
    console.log(`Updating transcript_status to 'processing' for file: ${videoFileId}`)
    const { error: statusUpdateError } = await supabase
      .from('video_files')
      .update({ transcript_status: 'processing' })
      .eq('id', videoFileId)
      
    if (statusUpdateError) {
      console.log(`Failed to update transcript_status to 'processing'. Error: ${JSON.stringify(statusUpdateError)}`)
    }
    
    // Extract transcript from Vimeo
    let transcriptText: string = '';
    let transcriptSource: 'vimeo' | 'manual' = 'manual';
    
    if (vimeoId) {
      console.log(`Attempting to extract transcript from Vimeo ID: ${vimeoId}`)
      const extractedTranscript = await extractVimeoTranscript(vimeoId);
      if (extractedTranscript) {
        transcriptText = extractedTranscript;
        transcriptSource = 'vimeo';
        console.log(`Successfully extracted Vimeo transcript: ${transcriptText.length} characters`)
      }
    }

    // If no transcript was extracted, create a placeholder based on title/description
    if (!transcriptText && (title || description)) {
      transcriptText = [title, description].filter(Boolean).join('. ');
      transcriptSource = 'manual';
      console.log(`No transcript available, using title/description as content: ${transcriptText.substring(0, 100)}...`)
    }

    if (!transcriptText) {
      console.warn('No transcript content available for video')
      await updateStatusToFailed(supabase, videoFileId, 'transcript')
      return { success: false, error: 'No transcript content available' }
    }

    // Create the transcript record
    const transcriptId = uuidv4()
    console.log(`Inserting transcript with ID: ${transcriptId} for video_file_id: ${videoFileId}`)
    const { error: transcriptError } = await supabase
      .from('video_transcripts')
      .insert({
        id: transcriptId,
        video_file_id: videoFileId,
        full_transcript: transcriptText,
        language: 'en',
        source: transcriptSource, // 'vimeo' if extracted from Vimeo, 'manual' if using title/description
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (transcriptError) {
      console.error('Error creating transcript:', transcriptError)
      await updateStatusToFailed(supabase, videoFileId, 'transcript')
      return { success: false, error: 'Failed to save transcript' }
    }

    // Generate chunks from the transcript
    console.log(`Generating chunks from transcript (length: ${transcriptText.length})`)
    const chunks = transcriptToChunks(transcriptText, videoFileId, vimeoDuration || undefined)
    console.log(`Generated ${chunks.length} chunks from transcript`)

    // Update chunks with transcript ID
    const chunksWithTranscriptId = chunks.map(chunk => ({
      ...chunk,
      video_transcript_id: transcriptId
    }))

    // Insert the chunks into the database
    console.log(`Inserting ${chunks.length} chunks into video_chunks table`)
    const { error: chunksError } = await supabase
      .from('video_chunks')
      .insert(chunksWithTranscriptId)

    if (chunksError) {
      console.error('Error creating chunks:', chunksError)
      await updateStatusToFailed(supabase, videoFileId, 'transcript')
      return { success: false, error: 'Failed to save video chunks' }
    }

    // Update the transcript status to 'completed'
    console.log(`Updating transcript_status to 'completed' for video_file_id: ${videoFileId}`)
    const { error: completedUpdateError } = await supabase
      .from('video_files')
      .update({ 
        transcript_status: 'completed',
        embedding_status: 'pending'
      })
      .eq('id', videoFileId)
      
    if (completedUpdateError) {
      console.log(`Failed to update transcript_status to 'completed'. Error: ${JSON.stringify(completedUpdateError)}`)
    }

    // Generate summary if we have sufficient content
    if (transcriptText.length > 100) {
      try {
        console.log(`Generating summary for video: ${title}`)
        const { error: summaryStatusError } = await supabase
          .from('video_files')
          .update({ summary_status: 'processing' })
          .eq('id', videoFileId)

        const summary = await generateVideoSummary(title || 'Untitled', description || '', transcriptText);
        
        const { error: summaryError } = await supabase
          .from('video_files')
          .update({ 
            summary: summary,
            summary_status: 'completed'
          })
          .eq('id', videoFileId)

        if (summaryError) {
          console.error('Error saving summary:', summaryError)
          await updateStatusToFailed(supabase, videoFileId, 'summary')
        } else {
          console.log('Successfully generated and saved video summary')
        }
      } catch (summaryError) {
        console.error('Error generating summary:', summaryError)
        await updateStatusToFailed(supabase, videoFileId, 'summary')
      }
    }

    // Trigger Supabase Edge Function for embedding generation
    console.log(`Attempting to trigger Supabase Edge Function for embedding generation`)
    try {
      const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-video-embeddings`;
      console.log(`Edge function URL: ${edgeFunctionUrl}`);
      
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ videoFileId: videoFileId })
      });
      
      if (!response.ok) {
        const responseText = await response.text();
        console.error(`❌ Edge function error (${response.status}): ${responseText}`);
      } else {
        const responseData = await response.text();
        console.log(`✅ Successfully triggered embedding generation for videoFileId=${videoFileId}`);
        console.log(`📊 Edge function response: ${responseData}`);
      }
    } catch (err) {
      console.error('Failed to trigger video embedding function:', err);
      // Continue even if edge function call fails
    }

    console.log(`Video processing COMPLETED SUCCESSFULLY for ID: ${videoFileId}`)
    return {
      success: true,
      chunkCount: chunks.length
    }
  } catch (error) {
    console.error('Error in processVideoFile:', error)
    await updateStatusToFailed(supabase, videoFileId, 'transcript')
    return { 
      success: false, 
      error: `Internal error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}