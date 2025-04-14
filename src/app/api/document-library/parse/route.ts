// /src/app/api/document-library/parse/route.ts
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import { createWorker } from 'tesseract.js'

interface RequestBody {
  fileUrl: string
  documentId: string
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
    const body = await req.json() as RequestBody
    const { fileUrl, documentId } = body

    if (!fileUrl || !documentId) {
      return NextResponse.json(
        { success: false, error: 'File URL and document ID are required' },
        { status: 400 }
      )
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
      // Store the content in Supabase
      const supabase = await createClient()
      
      // Check if entry already exists and update, or insert new
      const { data: existingContent } = await supabase
        .from('document_content')
        .select('id')
        .eq('document_id', documentId)
        .single()

      let result
      
      if (existingContent) {
        // Update existing content
        result = await supabase
          .from('document_content')
          .update({ content: extractedText, updated_at: new Date().toISOString() })
          .eq('document_id', documentId)
      } else {
        // Insert new content
        result = await supabase
          .from('document_content')
          .insert({
            document_id: documentId,
            content: extractedText,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
      }

      if (result.error) {
        console.error('Error saving document content:', result.error)
        return NextResponse.json(
          { success: false, error: `Failed to save document content: ${result.error.message}` },
          { status: 500 }
        )
      }

      // Process text for chunking
      try {
        // Split text into manageable chunks (around 500 tokens each)
        const chunks = splitIntoChunks(extractedText)
        console.log(`Split document into ${chunks.length} chunks`)
        
        // First, delete any existing chunks for this document to avoid duplicates
        await supabase
          .from('document_chunks')
          .delete()
          .eq('document_id', documentId)
        
        // Store each chunk in the database
        const timestamp = new Date().toISOString()
        const chunksToInsert = chunks.map((chunk, index) => ({
          document_id: documentId,
          chunk_index: index,
          content: chunk,
          created_at: timestamp,
          updated_at: timestamp
        }))
        
        const insertResult = await supabase
          .from('document_chunks')
          .insert(chunksToInsert)
        
        if (insertResult.error) {
          console.error('Error inserting chunks:', insertResult.error)
          // Continue execution - we've at least saved the full document content
        } else {
          console.log(`Successfully processed and stored ${chunks.length} chunks`)
        }
      } catch (error) {
        console.error('Error processing document chunks:', error)
        // Continue with the main response, even if chunking fails
        // This way, at least the document content is saved
      }

      // Return the extracted text in development mode
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({ 
          success: true,
          content: extractedText 
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
 */
function splitIntoChunks(text: string, targetTokens: number = 500): string[] {
  // First, split by paragraphs
  const paragraphs = text.split(/\n\s*\n/)
  const chunks: string[] = []
  let currentChunk: string[] = []
  let currentTokenCount = 0
  
  // Very rough token count estimation (words / 0.75)
  // Language models typically count 1 token ~= 4 characters or ~= 0.75 words
  const estimateTokens = (text: string): number => {
    return Math.ceil(text.split(/\s+/).length / 0.75)
  }
  
  for (const paragraph of paragraphs) {
    // Skip empty paragraphs
    if (!paragraph.trim()) continue
    
    const paragraphTokens = estimateTokens(paragraph)
    
    if (paragraphTokens > targetTokens * 2) {
      // If a single paragraph is very large, split it into sentences
      const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph]
      
      for (const sentence of sentences) {
        const sentenceTokens = estimateTokens(sentence)
        
        if (currentTokenCount + sentenceTokens > targetTokens && currentChunk.length > 0) {
          // Current chunk is full, start a new one
          chunks.push(currentChunk.join(' '))
          currentChunk = [sentence]
          currentTokenCount = sentenceTokens
        } else {
          // Add to current chunk
          currentChunk.push(sentence)
          currentTokenCount += sentenceTokens
        }
      }
    } else {
      // Check if adding this paragraph would exceed target size
      if (currentTokenCount + paragraphTokens > targetTokens && currentChunk.length > 0) {
        // Current chunk is full, store it and start a new one
        chunks.push(currentChunk.join(' '))
        currentChunk = [paragraph]
        currentTokenCount = paragraphTokens
      } else {
        // Add paragraph to current chunk
        currentChunk.push(paragraph)
        currentTokenCount += paragraphTokens
      }
    }
  }
  
  // Add the last chunk if not empty
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '))
  }
  
  return chunks
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