// my-app/src/app/api/document-library/search/route.ts

import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { logSearchActivity } from '@/lib/logSearchActivity'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

interface SearchRequestBody {
  query: string
  filters?: Record<string, any>
  match_threshold?: number
  match_count?: number
  sort_by?: 'similarity' | 'created_at' | 'title' // Support user-defined sort order
}

/**
 * Validates and sanitizes the search query
 */
function validateQuery(query: unknown): { valid: boolean; sanitized?: string; error?: string } {
  // Check if query exists and is a string
  if (typeof query !== 'string') {
    return { valid: false, error: 'Query must be a string' }
  }

  // Trim and check if empty
  const trimmed = query.trim()
  if (trimmed === '') {
    return { valid: false, error: 'Search query cannot be empty' }
  }

  // Additional validation could be added here
  // e.g., min/max length, special character handling, etc.

  return { valid: true, sanitized: trimmed }
}

/**
 * Extract a highlighted snippet from content around a specific position
 * @param content The full content text
 * @param length Maximum length of the snippet
 * @returns A snippet with ellipsis if truncated
 */
function createHighlight(content: string, length: number = 300): string {
  if (!content) return '';
  
  // For better highlighting, we could find the most relevant section
  // that contains keywords from the query, but this simple approach works for now
  if (content.length <= length) return content;
  
  return content.slice(0, length) + '...';
}

/**
 * API route that performs semantic search on document chunks using OpenAI embeddings
 * 
 * This endpoint:
 * 1. Authenticates the current user
 * 2. Generates embeddings for the search query
 * 3. Performs vector similarity search against document chunks
 * 4. Returns top matching documents
 * 5. Logs search activity
 */
export async function POST(req: Request) {
  try {
    // TODO: Rate limiting could be implemented here
    // Check if the user has exceeded their search quota
    // const rateLimitResult = await checkRateLimit(userId);
    // if (!rateLimitResult.allowed) {
    //   return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    // }

    // Parse incoming request
    const body: SearchRequestBody = await req.json()
    const { 
      query, 
      filters = {}, 
      match_threshold = 0.5, // Make threshold configurable
      match_count = 10, // Make count configurable
      sort_by = 'similarity' // Default sort order
    } = body

    // Validate query
    const queryValidation = validateQuery(query)
    if (!queryValidation.valid) {
      return NextResponse.json(
        { success: false, error: queryValidation.error },
        { status: 400 }
      )
    }
    
    const sanitizedQuery = queryValidation.sanitized as string
    console.log(`Processing search query: "${sanitizedQuery}"`, filters)

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Authentication error:', authError)
      return NextResponse.json(
        { success: false, error: 'User authentication failed' },
        { status: 401 }
      )
    }

    const userId = user.id
    console.log(`Authenticated user: ${userId}`)

    // Generate embeddings for the query using OpenAI
    let embedding: number[]
    try {
      console.log('Generating embedding for query')
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: sanitizedQuery
      })
      
      embedding = embeddingResponse.data[0].embedding
      console.log(`Generated embedding vector with ${embedding.length} dimensions`)
    } catch (embeddingError) {
      console.error('Error generating embeddings:', embeddingError)
      return NextResponse.json(
        { success: false, error: 'Failed to generate search embeddings' },
        { status: 500 }
      )
    }

    // Perform vector similarity search
    try {
      console.log('Performing vector similarity search')
      
      // Call match_documents RPC function which uses pgvector cosine distance
      const { data: matchResults, error: searchError } = await supabase.rpc(
        'match_documents',
        {
          query_embedding: embedding,
          match_threshold: match_threshold,
          match_count: match_count
        }
      )

      if (searchError) {
        console.error('Vector search error:', searchError)
        throw new Error(`Vector search failed: ${searchError.message}`)
      }

      console.log('Raw match results:', matchResults ? matchResults.length : 'none')
      
      // For test purposes, if no results from real search, generate mock data
      let testResults = matchResults;
      if (!testResults || testResults.length === 0) {
        // In development mode, provide sample data for testing the UI
        if (process.env.NODE_ENV === 'development') {
          console.log('Generating mock results for development testing')
          testResults = [
            {
              document_id: 'test-doc-1',
              chunk_index: 0,
              content: 'This is a sample content chunk about inverters. An inverter converts DC power from solar panels into AC power that can be used in homes.',
              similarity: 0.89
            },
            {
              document_id: 'test-doc-2',
              chunk_index: 1,
              content: 'Inverters are an essential component of solar energy systems, allowing the power generated to be used by household appliances.',
              similarity: 0.78
            }
          ]
        }
      }

      if (!testResults || testResults.length === 0) {
        console.log('No matching documents found')
        
        // Log the search activity (even for zero results)
        await logSearchActivity(supabase, userId, sanitizedQuery, filters, 0)
        
        // Return enhanced metadata
        return NextResponse.json({
          success: true,
          query: sanitizedQuery,
          result_count: 0,
          searched_at: new Date().toISOString(),
          filters_used: filters,
          sort_by,
          results: []
        })
      }

      console.log(`Found ${testResults.length} matching chunks`)

      // Get full document data for all matching chunks
      const documentIds = [...new Set(testResults.map(match => match.document_id))]
      console.log(`Retrieving ${documentIds.length} unique documents`)

      let documents;
      let documentsError;
      
      // For test documents, create mock document data
      if (documentIds.some(id => id.startsWith('test-doc'))) {
        console.log('Using mock document data for test documents')
        documents = documentIds.map(id => ({
          id,
          title: id === 'test-doc-1' ? 'Understanding Solar Inverters' : 'Solar Power Components',
          description: 'Sample document for testing the semantic search UI',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          embedding_status: 'complete',
          tags: ['Solar', 'Inverter', 'Energy']
        }))
      } else {
        // Real document lookup
        const result = await supabase
          .from('documents')
          .select('*')
          .in('id', documentIds)
          .eq('embedding_status', 'complete')
        
        documents = result.data;
        documentsError = result.error;
      }

      if (documentsError) {
        console.error('Error retrieving documents:', documentsError)
        throw new Error(`Document retrieval failed: ${documentsError.message}`)
      }

      // Safety check for empty documents
      if (!documents || documents.length === 0) {
        console.log('No documents found matching the chunks, using fallback')
        documents = documentIds.map(id => ({
          id,
          title: `Document ${id.slice(0, 8)}`,
          embedding_status: 'complete'
        }))
      }
      
      console.log(`Retrieved ${documents.length} documents`)

      // Combine document data with match data
      let results = documents.map(document => {
        // Find the highest similarity score for this document
        const matchingChunks = testResults.filter(match => match.document_id === document.id)
        const highestSimilarity = Math.max(...matchingChunks.map(chunk => chunk.similarity))
        
        // Sort chunks by similarity (highest first)
        const sortedChunks = [...matchingChunks].sort((a, b) => b.similarity - a.similarity)
        
        // Extract highlight from the highest-matching chunk
        const topChunk = sortedChunks[0]
        const highlight = topChunk ? createHighlight(topChunk.content) : ''
        
        return {
          ...document,
          similarity: highestSimilarity,
          highlight, // Add highlighted snippet
          // Include matching chunks that exceed the threshold
          matching_chunks: sortedChunks
            .filter(chunk => chunk.similarity >= match_threshold)
            .map(chunk => ({
              chunk_index: chunk.chunk_index,
              content: chunk.content,
              similarity: chunk.similarity
            }))
        }
      })

      // Apply filters if provided
      if (filters && Object.keys(filters).length > 0) {
        console.log('Applying filters to results:', filters)
        
        // Filter by role_type if provided
        if (filters.role_type) {
          results = results.filter(doc => 
            doc.visibility?.role_type === filters.role_type
          )
        }
        
        // Filter by tags if provided
        if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
          results = results.filter(doc => {
            // If document has no tags, it won't match
            if (!doc.tags || !Array.isArray(doc.tags)) return false
            
            // Check if any requested tag exists in document tags
            return filters.tags.some((tag: string) => doc.tags.includes(tag))
          })
        }
        
        // Add more filters as needed based on your schema
        
        console.log(`${results.length} documents remain after applying filters`)
      }

      // Sort results based on user preference
      if (sort_by === 'created_at') {
        results.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime()
          const dateB = new Date(b.created_at || 0).getTime()
          return dateB - dateA // Newest first
        })
        console.log('Results sorted by creation date (newest first)')
      } else if (sort_by === 'title') {
        results.sort((a, b) => {
          return (a.title || '').localeCompare(b.title || '')
        })
        console.log('Results sorted by title (A-Z)')
      } else {
        // Default: sort by similarity score (highest first)
        results.sort((a, b) => b.similarity - a.similarity)
        console.log('Results sorted by similarity (highest first)')
      }

      // Log the search activity
      await logSearchActivity(supabase, userId, sanitizedQuery, filters, results.length)

      // TODO: Usage metering could be implemented here
      // await trackSearchUsage(userId, results.length);

      const response = {
        success: true,
        query: sanitizedQuery,
        result_count: results.length,
        searched_at: new Date().toISOString(),
        filters_used: filters,
        sort_by,
        results
      };
      
      console.log(`Returning ${results.length} results`);
      
      // Return enhanced response with more metadata
      return NextResponse.json(response);
    } catch (error) {
      console.error('Search error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Search operation failed' 
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Unhandled error in search API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      },
      { status: 500 }
    )
  }
} 