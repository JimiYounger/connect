// /src/app/api/document-library/parse/route.ts
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import { createWorker } from 'tesseract.js'

// Renamed with underscore prefix since it's not used but documents API shape
interface _RequestBody {
  fileUrl: string
  documentId: string
  versionId?: string // Optional version ID parameter
}

/**
 * Extracts text content from uploaded documents based on file type
 * 
 * This API endpoint:
 * 1. Downloads the file from Supabase Storage
 * 2. Parses it using the appropriate library
 * 3. Stores the extracted text in the document_content table
 * 4. Chunks the text into smaller segments
 * 5. Stores chunks in the document_chunks table for future semantic search
 */
export async function POST(req: Request) {
  try {
    // Parse incoming request
    const body = await req.json()
    const { fileUrl, documentId, versionId } = body

    if (!fileUrl || !documentId) {
      return NextResponse.json(
        { success: false, error: 'File URL and document ID are required' },
        { status: 400 }
      )
    }
    
    // Log important parameters
    console.log(`Processing document: ${documentId}, version: ${versionId || 'unknown'}, URL: ${fileUrl}`)
    
    if (!versionId) {
      console.warn('No version ID provided - this might cause issues with version tracking')
    }

    // Get file extension to determine parser
    const fileExtension = getFileExtension(fileUrl)
    if (!fileExtension) {
      return NextResponse.json(
        { success: false, error: 'Could not determine file type' },
        { status: 400 }
      )
    }

    console.log(`Processing file: ${fileUrl} with extension: ${fileExtension}`)
    
    // Download the file using Supabase client to get around CORS issues
    let fileData: Blob | null = null;
    
    try {
      // Get Supabase client
      const supabase = await createClient()
      
      // Extract path from URL - we need to convert from public URL to storage path
      // URL format: https://[project].supabase.co/storage/v1/object/public/documents/[path]
      console.log('Extracting storage path from URL')
      const urlPath = new URL(fileUrl).pathname
      const segments = urlPath.split('/public/documents/')
      
      if (segments.length < 2) {
        console.error('Invalid URL format, cannot extract path:', urlPath)
        return NextResponse.json(
          { success: false, error: `Invalid file URL format: Cannot extract path from ${fileUrl}` },
          { status: 400 }
        )
      }
      
      const storagePath = segments[1]
      console.log(`Extracted storage path: ${storagePath}`)
      
      // Download with the client
      console.log(`Downloading file from Supabase storage: ${storagePath}`)
      const { data, error: downloadError } = await supabase
        .storage
        .from('documents')
        .download(storagePath)
      
      if (downloadError || !data) {
        console.error('Error downloading from Supabase storage:', downloadError)
        return NextResponse.json(
          { success: false, error: `Failed to download file: ${downloadError?.message || 'No file data returned'}` },
          { status: 500 }
        )
      }
      
      // Store the blob data
      fileData = data
      console.log('File successfully downloaded from Supabase storage')
      
    } catch (downloadError) {
      console.error('Exception in file download process:', downloadError)
      return NextResponse.json(
        { success: false, error: `Failed to download file: ${downloadError instanceof Error ? downloadError.message : 'Unknown error'}` },
        { status: 500 }
      )
    }

    // Make sure we got the file data
    if (!fileData) {
      console.error('No file data received after download')
      return NextResponse.json({
        success: false,
        error: 'Download completed but no file data was received'
      }, { status: 500 })
    }

    // Extract text based on file type
    let extractedText = ''
    
    try {
      // Process file based on extension
      console.log(`Parsing file with extension: ${fileExtension}`)
      
      if (fileExtension === 'pdf') {
        // Convert Blob to ArrayBuffer for pdf-parse
        const arrayBuffer = await fileData.arrayBuffer()
        extractedText = await parsePdfFromArrayBuffer(arrayBuffer)
      } else if (fileExtension === 'docx') {
        const arrayBuffer = await fileData.arrayBuffer()
        extractedText = await parseDocxFromArrayBuffer(arrayBuffer)
      } else if (['jpg', 'jpeg', 'png'].includes(fileExtension)) {
        extractedText = await parseImageFromBlob(fileData)
      } else {
        return NextResponse.json(
          { success: false, error: `Unsupported file type: ${fileExtension}` },
          { status: 400 }
        )
      }
      
      console.log(`Successfully extracted text (${extractedText.length} characters)`)
    } catch (parseError) {
      console.error('Error parsing file:', parseError)
      return NextResponse.json(
        { success: false, error: `Failed to parse file: ${parseError instanceof Error ? parseError.message : 'Unknown error'}` },
        { status: 500 }
      )
    }

    // If text was successfully extracted, save to database
    if (extractedText) {
      // Sanitize the text to remove problematic Unicode sequences
      console.log(`Sanitizing extracted text content (${extractedText.length} characters)`)
      
      // Function to sanitize text by removing or replacing problematic characters
      function sanitizeText(text: string): string {
        if (!text) return '';
        
        try {
          // Replace null bytes and other problematic control characters
          let sanitized = text.replace(/\u0000/g, ' ');
          
          // Replace other problematic Unicode escape sequences
          sanitized = sanitized.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDFFF]/g, ' ');
          
          // Replace any non-standard JSON characters that can cause issues
          sanitized = sanitized.replace(/[\u0000-\u001F\u007F-\u009F\u2000-\u200F\u2028-\u202F\uFFF0-\uFFFF]/g, ' ');
          
          // Additional replacement for any other problematic sequences
          // Convert to JSON and back as a test to ensure it's valid
          JSON.parse(JSON.stringify({ text: sanitized }));
          
          return sanitized;
        } catch (err) {
          console.warn('Advanced Unicode sanitization failed:', err);
          // Fallback: use a more aggressive cleanup approach
          try {
            // Convert to ASCII only as a last resort
            return text.replace(/[^\x00-\x7F]/g, ' ');
          } catch (fallbackErr) {
            console.error('Fallback sanitization failed:', fallbackErr);
            return 'Text extraction failed - content could not be sanitized';
          }
        }
      }
      
      const sanitizedText = sanitizeText(extractedText);
      console.log(`Text sanitized: original ${extractedText.length} chars, sanitized ${sanitizedText.length} chars`);
      
      // Store the content in Supabase
      const supabase = await createClient()
      
      // Store the content in document_content, handling versioning if applicable
      let result;
      
      // Check if an entry already exists for this document
      // For the content table, we're just going to replace the content for the 
      // document regardless of version, since that seems to be how the schema is set up
      const { data: _existingContent } = await supabase
        .from('document_content')
        .select('id')
        .eq('document_id', documentId)
        .single()

      // Use upsert to handle both insert and update cases in one operation
      console.log(`Upserting content for document ${documentId}`)
      
      result = await supabase
        .from('document_content')
        .upsert({
          document_id: documentId,
          content: sanitizedText,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'document_id',
          ignoreDuplicates: false
        })

      if (result.error) {
        console.error('Error saving document content:', result.error)
        return NextResponse.json(
          { success: false, error: `Failed to save document content: ${result.error.message}` },
          { status: 500 }
        )
      }

      // Process text for chunking
      try {
        console.log('Starting document chunking process...')
        
        // Split text into manageable chunks (around 500 tokens each)
        // Set max chunk size to 8000 characters to stay well under any potential database limits
        const chunks = splitIntoChunks(sanitizedText, 500, 8000)
        console.log(`Split document into ${chunks.length} chunks`, chunks.map(c => c.substring(0, 50) + '...'))
        
        if (chunks.length === 0) {
          console.error('No chunks generated from document text. Text length:', sanitizedText.length)
          throw new Error('Chunking algorithm produced no chunks')
        }
        
        // Delete existing chunks for this document
        console.log(`Deleting existing chunks for document: ${documentId}`)
        const { error: deleteError } = await supabase
          .from('document_chunks')
          .delete()
          .eq('document_id', documentId)
          
        if (deleteError) {
          console.error('Error deleting existing chunks:', deleteError)
          // Continue anyway - attempted to clear
        }
        
        // Store each chunk in the database - based on existing schema
        const timestamp = new Date().toISOString()
        const chunksToInsert = chunks.map((chunk, index) => ({
          document_id: documentId,
          chunk_index: index,
          content: chunk,
          created_at: timestamp
        }))
        
        console.log(`Preparing to insert ${chunksToInsert.length} chunks for document: ${documentId}`)
        console.log('First chunk example:', {
          ...chunksToInsert[0],
          content: chunksToInsert[0]?.content?.substring(0, 50) + '...' || 'No content'
        })
        
        // Filter out any fields that might not be in the schema
        const cleanedChunksToInsert = chunksToInsert.map(chunk => {
          // Keep only fields we know are in the schema
          return {
            document_id: chunk.document_id,
            chunk_index: chunk.chunk_index,
            content: chunk.content,
            created_at: chunk.created_at
          };
        });
        
        console.log('Attempting insert with cleaned chunks (removed updated_at field)')
        const insertResult = await supabase
          .from('document_chunks')
          .insert(cleanedChunksToInsert)
        
        if (insertResult.error) {
          console.error('Error inserting chunks:', insertResult.error)
          // Try to get more details about the error
          console.error('Insert error details:', JSON.stringify(insertResult.error))
          
          // Check if chunks are too large
          const largestChunk = chunks.reduce((max, chunk) => 
            chunk.length > max.length ? chunk : max, '');
          console.log(`Largest chunk size: ${largestChunk.length} characters`)
          
          // Try with batching instead of inserting all at once
          console.log('Attempting to insert chunks in smaller batches...')
          const BATCH_SIZE = 5;
          let successCount = 0;
          
          for (let i = 0; i < cleanedChunksToInsert.length; i += BATCH_SIZE) {
            const batch = cleanedChunksToInsert.slice(i, i + BATCH_SIZE);
            console.log(`Inserting batch ${i/BATCH_SIZE + 1} of ${Math.ceil(cleanedChunksToInsert.length/BATCH_SIZE)}`)
            
            const batchResult = await supabase
              .from('document_chunks')
              .insert(batch)
            
            if (batchResult.error) {
              console.error(`Error inserting batch ${i/BATCH_SIZE + 1}:`, batchResult.error)
              
              // If batch fails, try one by one
              console.log('Batch failed, trying individual inserts...')
              
              for (const chunk of batch) {
                const result = await supabase
                  .from('document_chunks')
                  .insert([chunk])
                
                if (!result.error) {
                  successCount++;
                } else {
                  console.error('Individual chunk insert failed:', {
                    error: result.error.message,
                    chunkIndex: chunk.chunk_index,
                    contentLength: chunk.content.length,
                    content: chunk.content.substring(0, 50) + '...'
                  })
                }
              }
            } else {
              successCount += batch.length;
              console.log(`Batch ${i/BATCH_SIZE + 1} inserted successfully`)
            }
          }
          
          console.log(`Successfully inserted ${successCount} out of ${cleanedChunksToInsert.length} chunks`)
          
          // Continue execution - we've at least saved the full document content
        } else {
          console.log(`Successfully processed and stored ${chunks.length} chunks for document: ${documentId}`)
        }
      } catch (error) {
        console.error('Error processing document chunks:', error)
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
        // Continue with the main response, even if chunking fails
        // This way, at least the document content is saved
      }

      // Return the extracted text in development mode
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({ 
          success: true,
          content: sanitizedText 
        })
      }

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to extract text from document' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error processing document:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}

/**
 * Split text into chunks of approximately 500 tokens
 * 
 * This is a simple implementation that splits by paragraphs first,
 * then combines or splits paragraphs to achieve the target chunk size.
 * It includes additional safeguards to ensure that chunks don't exceed database limits.
 */
function splitIntoChunks(text: string, targetTokens: number = 500, maxChunkSize: number = 10000): string[] {
  console.log('Starting text chunking process...')
  console.log(`Input text length: ${text.length} characters`)
  
  // Safety check for empty or invalid input
  if (!text || typeof text !== 'string') {
    console.error('Invalid text input for chunking:', typeof text)
    // Return at least one chunk with whatever we received
    return ["No content available"]
  }
  
  // Normalize the input text to handle any encoding issues
  let normalizedText = text.trim()
  if (normalizedText.length === 0) {
    console.warn('Empty text after trimming, creating minimal chunk')
    return ["No content available"]
  }
  
  try {
    // First, split by paragraphs
    // Use a more defensive approach to paragraph splitting
    const paragraphs = normalizedText.split(/\n\s*\n/).filter(p => p.trim().length > 0)
    console.log(`Split text into ${paragraphs.length} paragraphs`)
    
    // If we have no paragraphs after filtering, return a single chunk
    if (paragraphs.length === 0) {
      console.warn('No paragraphs found after filtering, using original text')
      return [normalizedText.substring(0, maxChunkSize)]
    }
    
    const chunks: string[] = []
    let currentChunk: string[] = []
    let currentTokenCount = 0
    
    // Very rough token count estimation (words / 0.75)
    // Language models typically count 1 token ~= 4 characters or ~= 0.75 words
    const estimateTokens = (text: string): number => {
      const words = text.split(/\s+/).filter(w => w.length > 0)
      return Math.ceil(words.length / 0.75)
    }
    
    // Process paragraphs into chunks
    for (const paragraph of paragraphs) {
      // Skip empty paragraphs
      const trimmedParagraph = paragraph.trim()
      if (trimmedParagraph.length === 0) continue
      
      const paragraphTokens = estimateTokens(trimmedParagraph)
      
      if (paragraphTokens > targetTokens * 1.5) {
        console.log(`Large paragraph found (${paragraphTokens} tokens), splitting into sentences`)
        // If a single paragraph is very large, split it into sentences
        const sentenceMatches = trimmedParagraph.match(/[^.!?]+[.!?]+/g)
        const sentences = sentenceMatches || [trimmedParagraph]
        console.log(`Split paragraph into ${sentences.length} sentences`)
        
        for (const sentence of sentences) {
          const sentenceTokens = estimateTokens(sentence)
          
          // If even a single sentence exceeds the max chunk size, split it further
          if (sentence.length > maxChunkSize) {
            console.log(`Extra large sentence found (${sentence.length} chars), splitting by character count`)
            // Split by character count
            for (let i = 0; i < sentence.length; i += maxChunkSize) {
              const sentencePart = sentence.substring(i, i + maxChunkSize)
              chunks.push(sentencePart)
              console.log(`Created chunk from large sentence part: ${sentencePart.substring(0, 50)}...`)
            }
            continue
          }
          
          if (currentTokenCount + sentenceTokens > targetTokens && currentChunk.length > 0) {
            // Current chunk is full, start a new one
            const joinedChunk = currentChunk.join(' ')
            chunks.push(joinedChunk)
            console.log(`Chunk completed with ${currentTokenCount} tokens, length: ${joinedChunk.length} chars`)
            currentChunk = [sentence]
            currentTokenCount = sentenceTokens
          } else {
            // Add to current chunk
            currentChunk.push(sentence)
            currentTokenCount += sentenceTokens
          }
        }
      } else {
        // Check if this paragraph would exceed max size
        if (trimmedParagraph.length > maxChunkSize) {
          console.log(`Paragraph exceeds max size (${trimmedParagraph.length} chars), splitting by character count`)
          for (let i = 0; i < trimmedParagraph.length; i += maxChunkSize) {
            const paragraphPart = trimmedParagraph.substring(i, i + maxChunkSize)
            chunks.push(paragraphPart)
            console.log(`Created chunk from large paragraph part: ${paragraphPart.substring(0, 50)}...`)
          }
          continue
        }
        
        // Check if adding this paragraph would exceed target token size
        if (currentTokenCount + paragraphTokens > targetTokens && currentChunk.length > 0) {
          // Current chunk is full, store it and start a new one
          const joinedChunk = currentChunk.join(' ')
          chunks.push(joinedChunk)
          console.log(`Chunk completed with ${currentTokenCount} tokens, length: ${joinedChunk.length} chars`)
          currentChunk = [trimmedParagraph]
          currentTokenCount = paragraphTokens
        } else {
          // Add paragraph to current chunk
          currentChunk.push(trimmedParagraph)
          currentTokenCount += paragraphTokens
        }
      }
    }
    
    // Add the last chunk if not empty
    if (currentChunk.length > 0) {
      const finalChunk = currentChunk.join(' ')
      chunks.push(finalChunk)
      console.log(`Final chunk completed with ${currentTokenCount} tokens, length: ${finalChunk.length} chars`)
    }
    
    console.log(`Chunking completed. Created ${chunks.length} chunks.`)
    
    // Ensure we have at least one chunk
    if (chunks.length === 0) {
      console.warn('No chunks were created through normal process, adding a default chunk')
      // Limit the size to prevent database issues
      chunks.push(normalizedText.substring(0, maxChunkSize))
    }
    
    // Verify chunk sizes before returning
    const verifiedChunks = chunks.map((chunk, index) => {
      if (chunk.length > maxChunkSize) {
        console.warn(`Chunk ${index} exceeds max size (${chunk.length} chars), truncating`)
        return chunk.substring(0, maxChunkSize)
      }
      return chunk
    })
    
    return verifiedChunks;
  } catch (error) {
    console.error('Error in chunking algorithm:', error)
    // Return at least one sensible chunk as fallback
    return [normalizedText.substring(0, maxChunkSize)]
  }
}

/**
 * Parse PDF document and extract text from ArrayBuffer
 */
async function parsePdfFromArrayBuffer(buffer: ArrayBuffer): Promise<string> {
  console.log('Parsing PDF document from ArrayBuffer')
  const data = new Uint8Array(buffer)
  const result = await pdfParse(data)
  return result.text
}

/**
 * Parse DOCX document and extract text from ArrayBuffer
 */
async function parseDocxFromArrayBuffer(buffer: ArrayBuffer): Promise<string> {
  console.log('Parsing DOCX document from ArrayBuffer')
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return result.value
}

/**
 * Parse image using OCR and extract text from Blob
 */
async function parseImageFromBlob(imageBlob: Blob): Promise<string> {
  console.log('Parsing image using OCR')
  
  // Convert Blob to ArrayBuffer
  const imageBuffer = await imageBlob.arrayBuffer()
  
  // Set up timeout for OCR operations (2 minutes)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minute timeout
  
  try {
    // Fixed Tesseract.js implementation based on proper API
    console.log('Initializing Tesseract worker')
    const worker = await createWorker('eng')
    
    try {
      // Convert ArrayBuffer to base64 string for Tesseract
      const imageBytes = new Uint8Array(imageBuffer)
      const base64 = Buffer.from(imageBytes).toString('base64')
      const imageData = `data:image/jpeg;base64,${base64}`
      
      console.log('Starting OCR recognition')
      const { data } = await worker.recognize(imageData)
      console.log('OCR completed successfully')
      return data.text
    } finally {
      console.log('Terminating Tesseract worker')
      await worker.terminate()
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('OCR processing timed out after 2 minutes')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Extract file extension from URL
 */
function getFileExtension(url: string): string {
  // Remove any query parameters
  const baseUrl = url.split('?')[0]
  const parts = baseUrl.split('.')
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : ''
}