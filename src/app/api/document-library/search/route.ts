// my-app/src/app/api/document-library/search/route.ts

import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { logSearchActivity } from '@/lib/logSearchActivity'
import { MatchDocumentResult } from '@/types/database.extensions'
import { Json } from '@/types/supabase'

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
  log_search?: boolean // Flag to control whether to log this search
}

interface DocumentVisibilityConditions {
  roleTypes?: string[];
  teams?: string[];
  areas?: string[];
  regions?: string[];
  [key: string]: any;
}

interface DocumentVisibility {
  id: string;
  conditions: Json | DocumentVisibilityConditions;
}

interface Document {
  id: string;
  title: string;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  embedding_status?: string | null;
  tags?: string[];
  role_type?: string;
  document_visibility?: DocumentVisibility[];
  [key: string]: any;
}

interface SearchResultDocument extends Document {
  similarity: number;
  highlight: string;
  matching_chunks: {
    chunk_index: number;
    content: string;
    similarity: number;
  }[];
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
    console.log('Search API received request');
    // TODO: Rate limiting could be implemented here
    // Check if the user has exceeded their search quota
    // const rateLimitResult = await checkRateLimit(userId);
    // if (!rateLimitResult.allowed) {
    //   return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    // }

    // Parse incoming request
    const body: SearchRequestBody = await req.json()
    
    // Extract and normalize filters - handle both regular objects and DevTools format
    let normalizedFilters: Record<string, any> = {};
    if (body.filters) {
      if (body.filters.properties && Array.isArray(body.filters.properties)) {
        // Handle DevTools object format
        normalizedFilters = body.filters.properties.reduce((obj: Record<string, any>, prop: any) => {
          if (prop && prop.name && 'value' in prop) {
            obj[prop.name] = prop.value;
          }
          return obj;
        }, {});
      } else {
        // Regular object
        normalizedFilters = body.filters;
      }
    }
    
    const { 
      query, 
      match_threshold = 0.5, // Make threshold configurable
      match_count = 10, // Make count configurable
      sort_by = 'similarity', // Default sort order
      log_search = true // Default to logging search
    } = body
    
    // Use normalized filters
    const filters: Record<string, any> = normalizedFilters;

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
    
    // For development only - provide a fallback user to avoid auth errors
    let user;
    try {
      // Try to get authenticated user
      const { data: userData, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('Authentication error:', authError)
        
        // In development mode, we'll use a mock user for testing
        if (process.env.NODE_ENV === 'development') {
          console.log('Using mock user for development testing')
          user = { id: 'mock-user-id', email: 'test@example.com' }
        } else {
          return NextResponse.json(
            { success: false, error: 'User authentication failed' },
            { status: 401 }
          )
        }
      } else {
        user = userData.user
      }
    } catch (error) {
      console.error('Error during authentication:', error)
      
      // Development fallback
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock user for development testing due to auth error')
        user = { id: 'mock-user-id', email: 'test@example.com' }
      } else {
        return NextResponse.json(
          { success: false, error: 'Authentication process failed' },
          { status: 500 }
        )
      }
    }

    // Ensure we have a user, even in development mode
    if (!user) {
      console.error('No user found and no fallback available')
      return NextResponse.json(
        { success: false, error: 'User authentication failed - no user found' },
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
      console.log('Performing vector similarity search, filters will be applied after fetching:', JSON.stringify(filters))
      
      // Now call the vector search function with only the required parameters
      const searchParams = {
        query_embedding: embedding,
        match_threshold: match_threshold,
        match_count: match_count
      };
      
      console.log('Calling match_documents with params:', JSON.stringify(searchParams));
      const { data: matchResults, error: searchError } = await supabase.rpc<MatchDocumentResult[]>(
        'match_documents',
        searchParams
      )

      if (searchError) {
        console.error('Vector search error:', searchError)
        throw new Error(`Vector search failed: ${searchError.message}`)
      }

      console.log('Raw match results:', matchResults ? matchResults.length : 'none')
      
      // For test purposes, if no results from real search, generate mock data
      let testResults: MatchDocumentResult[] = matchResults || [];
      if (testResults.length === 0) {
        // In development mode, provide sample data for testing the UI
        if (process.env.NODE_ENV === 'development') {
          console.log('Generating mock results for development testing')
          
          // Create mock data based on filters
          const mockTestDocs = [
            {
              document_id: 'test-doc-1',
              chunk_index: 0,
              content: 'This is a sample content chunk about inverters. An inverter converts DC power from solar panels into AC power that can be used in homes.',
              similarity: 0.89,
              metadata: {
                category: 'Energy',
                subcategory: 'Renewable',
                tags: ['Solar', 'Inverter', 'Energy']
              }
            },
            {
              document_id: 'test-doc-2',
              chunk_index: 1,
              content: 'Inverters are an essential component of solar energy systems, allowing the power generated to be used by household appliances.',
              similarity: 0.78,
              metadata: {
                category: 'Technology',
                subcategory: 'Electronics',
                tags: ['Solar', 'Energy', 'Electronics']
              }
            },
            {
              document_id: 'test-doc-3',
              chunk_index: 0,
              content: 'Financial planning for renewable energy projects requires careful consideration of incentives and long-term ROI calculations.',
              similarity: 0.72,
              metadata: {
                category: 'Finance',
                subcategory: 'Investment',
                tags: ['Investment', 'Renewable', 'Energy']
              }
            },
            {
              document_id: 'test-doc-4',
              chunk_index: 0,
              content: 'HR training materials for new technicians should include safety protocols for working with high-voltage solar systems.',
              similarity: 0.68,
              metadata: {
                category: 'HR',
                subcategory: 'Training',
                tags: ['Training', 'Safety', 'HR']
              }
            }
          ];
          
          // Filter mock data based on provided filters
          let filteredMockDocs = [...mockTestDocs];
          
          if (filters && Object.keys(filters).length > 0) {
            console.log('Filtering mock data with:', filters);
            
            if (filters.category) {
              filteredMockDocs = filteredMockDocs.filter(doc => 
                doc.metadata.category === filters.category
              );
              console.log(`After category filter: ${filteredMockDocs.length} docs`);
            }
            
            if (filters.subcategory) {
              filteredMockDocs = filteredMockDocs.filter(doc => 
                doc.metadata.subcategory === filters.subcategory
              );
              console.log(`After subcategory filter: ${filteredMockDocs.length} docs`);
            }
            
            if (filters.tags && Array.isArray(filters.tags)) {
              filteredMockDocs = filteredMockDocs.filter(doc => 
                doc.metadata.tags.some(tag => filters.tags.includes(tag))
              );
              console.log(`After tag filter: ${filteredMockDocs.length} docs`);
            }
          }
          
          // Use the filtered mock docs
          testResults = filteredMockDocs;
          console.log(`Generated ${testResults.length} mock results after filtering`);
        }
      }

      if (testResults.length === 0) {
        console.log('No matching documents found')
        
        // Log the search activity (even for zero results) if logging is enabled
        if (log_search) {
          await logSearchActivity(supabase, userId, sanitizedQuery, filters, 0)
        }
        
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

      let documents: Document[] = [];
      let documentsError;
      
      // For test documents, create mock document data
      if (documentIds.some(id => id.startsWith('test-doc'))) {
        console.log('Using mock document data for test documents')
        documents = documentIds.map(id => {
          // Get test document info based on ID
          let title, category, subcategory, tagsList;
          
          switch(id) {
            case 'test-doc-1':
              title = 'Understanding Solar Inverters';
              category = 'Energy';
              subcategory = 'Renewable';
              tagsList = ['Solar', 'Inverter', 'Energy'];
              break;
            case 'test-doc-2':
              title = 'Solar Power Components';
              category = 'Technology';
              subcategory = 'Electronics';
              tagsList = ['Solar', 'Energy', 'Electronics'];
              break;
            case 'test-doc-3':
              title = 'Financial Planning for Renewable Energy';
              category = 'Finance';
              subcategory = 'Investment';
              tagsList = ['Investment', 'Renewable', 'Energy'];
              break;
            case 'test-doc-4':
              title = 'HR Training for Solar Technicians';
              category = 'HR';
              subcategory = 'Training';
              tagsList = ['Training', 'Safety', 'HR'];
              break;
            default:
              title = `Document ${id}`;
              category = 'Uncategorized';
              subcategory = 'General';
              tagsList = ['Document'];
          }
          
          // Create document with appropriate metadata
          return {
            id,
            title,
            description: 'Sample document for testing the semantic search UI',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            embedding_status: 'complete',
            tags: tagsList,
            // Include mock document categories and subcategories for filtering tests
            document_category: {
              id: `cat-${id.split('-')[2]}`,
              name: category
            },
            document_subcategory: {
              id: `sub-${id.split('-')[2]}`,
              name: subcategory
            },
            // Will be extracted to category_name and subcategory_name in the results
            category_name: category,
            subcategory_name: subcategory
          };
        });
      } else {
        // Real document lookup - with category and subcategory joins
        const result = await supabase
          .from('documents')
          .select(`
            *,
            document_visibility (
              id,
              conditions
            ),
            document_category:document_category_id (
              id,
              name
            ),
            document_subcategory:document_subcategory_id (
              id,
              name
            ),
            document_tag_assignments (
              tag:tag_id (
                id,
                name
              )
            )
          `)
          .in('id', documentIds)
          .eq('embedding_status', 'complete')
        
        // Ensure we handle null safely
        documents = result.data || [];
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
      let results: SearchResultDocument[] = documents.map(document => {
        // Find the highest similarity score for this document
        const matchingChunks = testResults.filter(match => match.document_id === document.id)
        const highestSimilarity = Math.max(...matchingChunks.map(chunk => chunk.similarity))
        
        // Sort chunks by similarity (highest first)
        const sortedChunks = [...matchingChunks].sort((a, b) => b.similarity - a.similarity)
        
        // Extract highlight from the highest-matching chunk
        const topChunk = sortedChunks[0]
        const highlight = topChunk ? createHighlight(topChunk.content) : ''
        
        // Extract category and subcategory names for filtering
        let category_name = null;
        let subcategory_name = null;
        
        if (document.document_category && document.document_category.name) {
          category_name = document.document_category.name;
          console.log(`Document ${document.id} has category: ${category_name}`);
        }
        
        if (document.document_subcategory && document.document_subcategory.name) {
          subcategory_name = document.document_subcategory.name;
          console.log(`Document ${document.id} has subcategory: ${subcategory_name}`);
        }
        
        return {
          ...document,
          category_name,
          subcategory_name,
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

      // Process document tags to extract names from the nested structure
      for (const doc of results) {
        // Extract tag names from the document_tag_assignments join
        if (doc.document_tag_assignments && Array.isArray(doc.document_tag_assignments) && doc.document_tag_assignments.length > 0) {
          // Extract tag names from the nested join
          const tagNames = doc.document_tag_assignments
            .filter(assignment => assignment.tag && assignment.tag.name)
            .map(assignment => assignment.tag.name);
          
          // Attach tags array to document
          if (tagNames.length > 0) {
            doc.tags = tagNames;
            console.log(`Document ${doc.id} has tags: ${tagNames.join(', ')}`);
          }
        }
      }
      
      // Apply filters if provided - this is now the primary filtering step
      if (filters && Object.keys(filters).length > 0) {
        console.log('Applying post-search filters:', filters)
        
        // Filter by category ID if provided
        if (filters.categoryId) {
          results = results.filter(doc => doc.document_category_id === filters.categoryId);
          console.log(`After category filter (ID: ${filters.categoryId}): ${results.length} documents`);
        }
        
        // Filter by subcategory ID if provided
        if (filters.subcategoryId) {
          results = results.filter(doc => doc.document_subcategory_id === filters.subcategoryId);
          console.log(`After subcategory filter (ID: ${filters.subcategoryId}): ${results.length} documents`);
        }
        
        // Filter by role_type if provided
        if (filters.role_type) {
          results = results.filter(doc => {
            // Check if document has visibility conditions
            if (doc.document_visibility && doc.document_visibility.length > 0) {
              const visibilityConditions = doc.document_visibility[0].conditions;
              // Safely check if the conditions object has roleTypes and it includes the filter value
              if (visibilityConditions && 
                  typeof visibilityConditions === 'object' &&
                  'roleTypes' in visibilityConditions &&
                  Array.isArray(visibilityConditions.roleTypes)) {
                return visibilityConditions.roleTypes.includes(filters.role_type);
              }
            }
            
            // Fallback to direct role_type if available
            return doc.role_type === filters.role_type;
          });
        }
        
        // Filter by tags if provided (using tag names - keep for debugging if needed or adapt)
        if (filters.tagId) {
          results = results.filter(doc => {
            // If document has no tags, it won't match
            if (!doc.tags || !Array.isArray(doc.tags)) return false;
            
            // Check if any assigned tag has the required ID
            return doc.tags.some((tag: string) => 
              tag === filters.tagId
            );
          })
          console.log(`After tag filter (ID: ${filters.tagId}): ${results.length} documents`);
        }
        
        // Add more filters as needed based on your schema
        
        console.log(`${results.length} documents remain after applying all filters`)
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

      // Log the search activity if logging is enabled
      if (log_search) {
        try {
          await logSearchActivity(supabase, userId, sanitizedQuery, filters, results.length);
        } catch (logError) {
          console.error('Error logging search activity:', logError);
          // Don't fail the whole request if logging fails
        }
      }

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