// my-app/src/app/api/video-library/search/route.ts

import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { logSearchActivity } from '@/lib/logSearchActivity'
import { MatchVideoResult } from '@/types/database.extensions'
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

interface VideoVisibilityConditions {
  roleTypes?: string[];
  teams?: string[];
  areas?: string[];
  regions?: string[];
  [key: string]: any;
}

interface VideoVisibility {
  id: string;
  conditions: Json | VideoVisibilityConditions;
}

interface Video {
  id: string;
  title: string;
  description?: string | null;
  vimeo_id?: string | null;
  vimeo_duration?: number | null;
  vimeo_thumbnail_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  embedding_status?: string | null;
  tags?: string[];
  role_type?: string;
  video_visibility?: VideoVisibility[];
  [key: string]: any;
}

interface SearchResultVideo extends Video {
  similarity: number;
  highlight: string;
  matching_chunks: {
    chunk_index: number;
    content: string;
    similarity: number;
    timestamp_start?: number;
    timestamp_end?: number;
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
 * GET handler for simple text-based video search (used by VideoSearch component)
 * Searches video titles and descriptions without semantic embeddings
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const query = url.searchParams.get('q')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    
    if (!query || query.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Search query is required'
      }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user profile for permission checking
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role_type, team, area, region')
      .eq('user_id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Simple text search on title and description
    const { data: videos, error } = await supabase
      .from('video_files')
      .select(`
        id,
        title,
        description,
        vimeo_duration,
        video_categories (name),
        video_subcategories (name)
      `)
      .eq('library_status', 'approved')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit)

    if (error) {
      console.error('Error searching videos:', error)
      return NextResponse.json(
        { success: false, error: 'Search failed' },
        { status: 500 }
      )
    }

    // Format results for VideoSearch component
    const formattedResults = (videos || []).map((video: any) => ({
      id: video.id,
      title: video.title,
      description: video.description,
      category: video.video_categories?.name,
      subcategory: video.video_subcategories?.name,
      duration: video.vimeo_duration
    }))

    return NextResponse.json({
      success: true,
      data: formattedResults
    })

  } catch (error) {
    console.error('Error in video search GET:', error)
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    )
  }
}

/**
 * API route that performs semantic search on video chunks using OpenAI embeddings
 * 
 * This endpoint:
 * 1. Validates the search query
 * 2. Generates an embedding for the query using OpenAI
 * 3. Uses Supabase's vector similarity search to find matching video chunks
 * 4. Returns results with similarity scores and highlights
 * 5. Optionally logs search activity for analytics
 * 6. Applies visibility filtering based on user permissions
 */
export async function POST(req: Request) {
  let searchQuery = '';
  
  try {
    const body = await req.json()
    const { 
      query, 
      filters = {}, 
      match_threshold = 0.5, 
      match_count = 10,
      sort_by = 'similarity',
      log_search = false 
    }: SearchRequestBody = body

    searchQuery = query;

    // Validate query
    const queryValidation = validateQuery(query)
    if (!queryValidation.valid) {
      return NextResponse.json(
        { success: false, error: queryValidation.error },
        { status: 400 }
      )
    }

    const sanitizedQuery = queryValidation.sanitized!

    // Validate match_threshold
    if (typeof match_threshold !== 'number' || match_threshold < 0 || match_threshold > 1) {
      return NextResponse.json(
        { success: false, error: 'match_threshold must be a number between 0 and 1' },
        { status: 400 }
      )
    }

    // Validate match_count
    if (typeof match_count !== 'number' || match_count < 1 || match_count > 100) {
      return NextResponse.json(
        { success: false, error: 'match_count must be a number between 1 and 100' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user profile for permission checking
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role_type, team, area, region')
      .eq('user_id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Generate embedding for the search query
    let queryEmbedding: number[]
    try {
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: sanitizedQuery,
      })
      queryEmbedding = embeddingResponse.data[0].embedding
    } catch (embeddingError) {
      console.error('Error generating embedding for search query:', embeddingError)
      return NextResponse.json(
        { success: false, error: 'Failed to generate search embedding' },
        { status: 500 }
      )
    }

    // Build the video search query
    const rpcParams: Record<string, any> = {
      query_embedding: queryEmbedding,
      match_threshold,
      match_count
    }

    // Add filters to RPC params
    if (filters.categoryId) {
      rpcParams.filter_category_id = filters.categoryId
    }
    
    if (filters.subcategoryId) {
      rpcParams.filter_subcategory_id = filters.subcategoryId
    }
    
    if (filters.seriesId) {
      rpcParams.filter_series_id = filters.seriesId
    }
    
    if (filters.tagId) {
      rpcParams.filter_tag_ids = [filters.tagId]
    }

    // Execute the semantic search
    const { data: searchResults, error: searchError } = await supabase
      .rpc('match_video_chunks', rpcParams) as { data: MatchVideoResult[] | null, error: any }

    if (searchError) {
      console.error('Error performing video search:', searchError)
      return NextResponse.json(
        { success: false, error: `Search failed: ${searchError.message}` },
        { status: 500 }
      )
    }

    if (!searchResults) {
      return NextResponse.json({
        success: true,
        results: [],
        total: 0,
        query: sanitizedQuery,
        filters
      })
    }

    // Group results by video_id
    const videoGroups = new Map<string, MatchVideoResult[]>()
    
    for (const result of searchResults) {
      const videoId = result.video_id
      if (!videoGroups.has(videoId)) {
        videoGroups.set(videoId, [])
      }
      videoGroups.get(videoId)!.push(result)
    }

    // For each video, get additional metadata and check visibility
    const enrichedResults: SearchResultVideo[] = []

    for (const [videoId, chunks] of videoGroups) {
      // Get video details
      const { data: videoData, error: videoError } = await supabase
        .from('video_files')
        .select(`
          id,
          title,
          description,
          vimeo_id,
          vimeo_duration,
          vimeo_thumbnail_url,
          custom_thumbnail_url,
          thumbnail_source,
          created_at,
          updated_at,
          embedding_status,
          video_visibility (id, conditions),
          video_categories (id, name),
          video_subcategories (id, name),
          video_series (id, name),
          video_tag_assignments (
            video_tags (id, name)
          )
        `)
        .eq('id', videoId)
        .single()

      if (videoError || !videoData) {
        console.warn(`Failed to fetch video data for ID ${videoId}:`, videoError)
        continue
      }

      // Check visibility permissions
      let hasAccess = true

      // If user is not admin, check visibility conditions
      if (!userProfile.role_type || userProfile.role_type.toLowerCase() !== 'admin') {
        if (videoData.video_visibility && videoData.video_visibility.length > 0) {
          hasAccess = false

          // Check each visibility condition
          for (const visibility of videoData.video_visibility) {
            const conditions = visibility.conditions as VideoVisibilityConditions

            // If no conditions or empty conditions, video is public
            if (!conditions || Object.keys(conditions).length === 0) {
              hasAccess = true
              break
            }

            // Check role type
            if (conditions.roleTypes && userProfile.role_type && conditions.roleTypes.includes(userProfile.role_type)) {
              hasAccess = true
              break
            }

            // Check team
            if (conditions.teams && userProfile.team && conditions.teams.includes(userProfile.team)) {
              hasAccess = true
              break
            }

            // Check area
            if (conditions.areas && userProfile.area && conditions.areas.includes(userProfile.area)) {
              hasAccess = true
              break
            }

            // Check region
            if (conditions.regions && userProfile.region && conditions.regions.includes(userProfile.region)) {
              hasAccess = true
              break
            }
          }
        }
      }

      if (!hasAccess) {
        continue
      }

      // Calculate overall similarity (average of chunk similarities)
      const avgSimilarity = chunks.reduce((sum, chunk) => sum + chunk.similarity, 0) / chunks.length

      // Create highlight from best matching chunk
      const bestChunk = chunks.reduce((best, current) => 
        current.similarity > best.similarity ? current : best
      )
      const highlight = createHighlight(bestChunk.content)

      // Format matching chunks
      const matchingChunks = chunks.map(chunk => ({
        chunk_index: chunk.chunk_index,
        content: chunk.content,
        similarity: chunk.similarity,
        timestamp_start: chunk.timestamp_start,
        timestamp_end: chunk.timestamp_end
      }))

      // Extract tags
      const tags = videoData.video_tag_assignments
        ? videoData.video_tag_assignments.map((ta: any) => ta.video_tags?.name).filter(Boolean)
        : []

      enrichedResults.push({
        id: videoData.id,
        title: videoData.title,
        description: videoData.description,
        vimeo_id: videoData.vimeo_id,
        vimeo_duration: videoData.vimeo_duration,
        vimeo_thumbnail_url: videoData.vimeo_thumbnail_url,
        custom_thumbnail_url: videoData.custom_thumbnail_url,
        thumbnail_source: videoData.thumbnail_source,
        created_at: videoData.created_at,
        updated_at: videoData.updated_at,
        embedding_status: videoData.embedding_status,
        tags,
        similarity: avgSimilarity,
        highlight,
        matching_chunks: matchingChunks,
        category_name: videoData.video_categories?.name,
        subcategory_name: videoData.video_subcategories?.name,
        series_name: videoData.video_series?.name
      })
    }

    // Sort results
    let sortedResults = enrichedResults
    if (sort_by === 'similarity') {
      sortedResults = enrichedResults.sort((a, b) => b.similarity - a.similarity)
    } else if (sort_by === 'created_at') {
      sortedResults = enrichedResults.sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      )
    } else if (sort_by === 'title') {
      sortedResults = enrichedResults.sort((a, b) => a.title.localeCompare(b.title))
    }

    // Log search activity if requested
    if (log_search) {
      try {
        await logSearchActivity(supabase, user.id, sanitizedQuery, filters, sortedResults.length)
      } catch (logError) {
        console.error('Error logging search activity:', logError)
        // Don't fail the request if logging fails
      }
    }

    return NextResponse.json({
      success: true,
      results: sortedResults,
      total: sortedResults.length,
      query: sanitizedQuery,
      filters,
      sort_by,
      match_threshold,
      match_count
    })

  } catch (error) {
    console.error('Error in video search API:', error)
    
    // Log the failed search for debugging
    if (searchQuery) {
      try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await logSearchActivity(supabase, user.id, searchQuery, { error_message: error instanceof Error ? error.message : 'Unknown error' }, 0)
        }
      } catch (logError) {
        console.error('Error logging failed search:', logError)
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      },
      { status: 500 }
    )
  }
}