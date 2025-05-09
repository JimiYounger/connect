// my-app/src/app/api/document-library/list/route.ts

// API route for fetching documents with filters
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export interface DocumentListParams {
  document_category_id?: string
  document_subcategory_id?: string
  tags?: string[]
  uploadedBy?: string
  searchQuery?: string
  page?: number
  limit?: number
}

export async function POST(req: Request) {
  try {
    // Parse request body
    const params = await req.json()
    const {
      document_category_id,
      document_subcategory_id,
      tags,
      uploadedBy,
      searchQuery,
      page = 1,
      limit = 20
    } = params

    // Calculate offset for pagination
    const offset = (page - 1) * limit
    
    // Track IDs from filtering for counting
    let matchingContentIds: string[] | undefined
    let matchingTagIds: string[] | undefined
    let visibleDocIds: string[] = []

    // Get the authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user profile to check permissions
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('id, role_type, team, area, region')
      .eq('user_id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Start building the query
    let query = supabase
      .from('documents')
      .select(`
        *,
        document_content (content),
        category:document_categories!documents_document_category_id_fkey (id, name),
        subcategory:document_subcategories!documents_document_subcategory_id_fkey (id, name),
        uploaded_by_user:user_profiles!uploaded_by (id, first_name, last_name, email),
        tags:document_tag_assignments (
          tag:document_tags (id, name)
        ),
        chunks_count:document_chunks (count)
      `)
      
    // Apply category filter
    if (document_category_id) {
      query = query.eq('document_category_id', document_category_id)
    }
    
    // Apply subcategory filter
    if (document_subcategory_id) {
      query = query.eq('document_subcategory_id', document_subcategory_id)
    }
    
    // Apply uploaded_by filter (for admins)
    if (uploadedBy && userProfile.role_type && userProfile.role_type.toLowerCase() === 'admin') {
      query = query.eq('uploaded_by', uploadedBy)
    }
    
    // Apply visibility filters based on user role
    // This assumes document_visibility has a JSONB column called 'conditions'
    // that contains role_type, teams, areas, regions
    if (!userProfile.role_type || userProfile.role_type.toLowerCase() !== 'admin') {
      // For non-admins, we need to implement a simplified filtering approach
      // Non-admins can only see documents that match their role or are unrestricted
      
      // First get all documents that match this user's role
      // Use proper JSONB query syntax with ->> for text extraction
      // Use role_type directly
      const userRoleType = userProfile.role_type || ''
      const { data: roleMatchDocs } = userRoleType ? await supabase
        .from('document_visibility')
        .select('document_id')
        .eq('conditions->>role_type', userRoleType) : { data: [] }
      
      // Also get documents with no role restriction
      const { data: noRoleDocs } = await supabase
        .from('document_visibility')
        .select('document_id')
        .is('conditions->>role_type', null)
      
      // Combine document IDs and filter out null/undefined values
      const roleDocIds = (roleMatchDocs || [])
        .map(d => d.document_id)
        .filter((id): id is string => id !== null && id !== undefined)
      
      const noRoleDocIds = (noRoleDocs || [])
        .map(d => d.document_id)
        .filter((id): id is string => id !== null && id !== undefined)
      
      visibleDocIds = [...roleDocIds, ...noRoleDocIds]
      
      // If we have matching documents, filter to only those
      if (visibleDocIds.length > 0) {
        query = query.in('id', visibleDocIds)
      } else {
        // If no matches, return empty result
        return NextResponse.json({
          success: true,
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0
        })
      }
    }
    
    // Apply search query to document content if provided
    if (searchQuery && searchQuery.trim() !== '') {
      // Get document IDs that match the search query
      const { data: contentMatches } = await supabase
        .from('document_content')
        .select('document_id')
        .textSearch('content', searchQuery, {
          type: 'plain'
        })
      
      // Apply document ID filter based on content matches
      if (contentMatches && contentMatches.length > 0) {
        matchingContentIds = contentMatches.map(match => match.document_id)
        query = query.in('id', matchingContentIds)
      } else {
        // If no content matches, return empty result
        return NextResponse.json({
          success: true,
          data: [],
          total: 0
        })
      }
    }
    
    // Apply tag filter if provided
    if (tags && tags.length > 0) {
      // Get document IDs that have all the specified tags
      const { data: tagMatches } = await supabase
        .from('document_tag_assignments')
        .select('document_id, tag_id')
        .in('tag_id', tags)
      
      if (tagMatches && tagMatches.length > 0) {
        // Group by document_id to find docs that have all the required tags
        const docTagCounts: Record<string, number> = {}
        
        for (const match of tagMatches) {
          if (match.document_id) {
            docTagCounts[match.document_id] = (docTagCounts[match.document_id] || 0) + 1
          }
        }
        
        // Find documents that have all the required tags
        matchingTagIds = Object.entries(docTagCounts)
          .filter(([_, count]) => count >= tags.length)
          .map(([docId]) => docId)
        
        if (matchingTagIds.length > 0) {
          query = query.in('id', matchingTagIds)
        } else {
          // If no tag matches, return empty result
          return NextResponse.json({
            success: true,
            data: [],
            total: 0
          })
        }
      } else {
        // If no tag matches, return empty result
        return NextResponse.json({
          success: true,
          data: [],
          total: 0
        })
      }
    }
    
    // Create a separate count query with the same filters
    let countQuery = supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })

    // Apply the same filters as the main query
    if (document_category_id) {
      countQuery = countQuery.eq('document_category_id', document_category_id)
    }
    
    if (document_subcategory_id) {
      countQuery = countQuery.eq('document_subcategory_id', document_subcategory_id)
    }
    
    if (uploadedBy && userProfile.role_type && userProfile.role_type.toLowerCase() === 'admin') {
      countQuery = countQuery.eq('uploaded_by', uploadedBy)
    }
    
    // Add visibility filtering to count query for non-admins
    if ((!userProfile.role_type || userProfile.role_type.toLowerCase() !== 'admin') && visibleDocIds && visibleDocIds.length > 0) {
      countQuery = countQuery.in('id', visibleDocIds)
    }
    
    // For ID-based filters (from content and tag searches)
    if (searchQuery && searchQuery.trim() !== '') {
      // Only apply the filter if we have matching content IDs
      const contentIds = matchingContentIds || []
      if (contentIds.length > 0) {
        countQuery = countQuery.in('id', contentIds)
      } else {
        // No matching content, return zero count
        return NextResponse.json({
          success: true,
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0
        })
      }
    }
    
    if (tags && tags.length > 0) {
      // Only apply the filter if we have matching tag IDs
      const tagIds = matchingTagIds || []
      if (tagIds.length > 0) {
        countQuery = countQuery.in('id', tagIds)
      } else {
        // No matching tags, return zero count
        return NextResponse.json({
          success: true,
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0
        })
      }
    }
    
    // Execute the count query
    const { count, error: countError } = await countQuery
    
    if (countError) {
      console.error('Error getting document count:', countError)
      return NextResponse.json(
        { success: false, error: `Failed to get document count: ${countError.message}` },
        { status: 500 }
      )
    }
    
    // Use the count (will be null if no rows match)
    const total = count || 0
    
    // Apply pagination
    query = query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // Execute the query
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching documents:', error)
      return NextResponse.json(
        { success: false, error: `Failed to fetch documents: ${error.message}` },
        { status: 500 }
      )
    }
    
    // Process the data to have a cleaner structure
    const processedData = data.map(doc => {
      // Use summary if available, otherwise generate contentPreview from document_content
      let summary = doc.summary || null;
      let contentPreview: string | null = null;
      
      // If no summary exists, generate contentPreview from document_content
      if (!summary && doc.document_content) {
        // Handle document_content as a single object or array
        const content = Array.isArray(doc.document_content) 
          ? doc.document_content[0]?.content 
          : doc.document_content.content
          
        if (content) {
          contentPreview = content.substring(0, 300) + (content.length > 300 ? '...' : '')
        }
      }
      
      // Format tags
      const formattedTags = doc.tags
        ? doc.tags
            .filter((t: { tag: { id: string; name: string } | null }) => t.tag !== null) // Filter out any null tags
            .map((t: { tag: { id: string; name: string } | null }) => {
              if (!t.tag) return null
              return {
                id: t.tag.id,
                name: t.tag.name
              }
            })
            .filter(Boolean) // Remove any null values
        : []
      
      // Get chunks count
      const chunksCount = doc.chunks_count ? (Array.isArray(doc.chunks_count) ? doc.chunks_count.length : 0) : 0
      
      return {
        id: doc.id,
        title: doc.title,
        description: doc.description,
        category: doc.category,
        subcategory: doc.subcategory,
        summary,
        contentPreview,
        tags: formattedTags,
        uploadedBy: doc.uploaded_by_user,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
        chunksCount,
        summaryStatus: doc.summary_status
      }
    })
    
    return NextResponse.json({
      success: true,
      data: processedData,
      total: total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
    
  } catch (error) {
    console.error('Error in document list API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}