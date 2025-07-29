// API route for fetching Leadership Training Decks documents
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { LTD_CONSTANTS } from '@/features/ltd/types'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

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

    // Build query for Leadership Training > Decks documents with custom metadata
    let query = supabase
      .from('documents')
      .select(`
        *,
        category:document_categories!documents_document_category_id_fkey (id, name),
        subcategory:document_subcategories!documents_document_subcategory_id_fkey (id, name),
        uploaded_by_user:user_profiles!uploaded_by (id, first_name, last_name, email),
        tags:document_tag_assignments (
          tag:document_tags (id, name)
        ),
        custom_metadata:document_custom_metadata!document_custom_metadata_document_id_fkey (
          id,
          metadata_type,
          presented_by,
          meeting_date,
          created_at,
          updated_at,
          created_by
        )
      `)
      .eq('document_category_id', LTD_CONSTANTS.CATEGORY_ID)
      .eq('document_subcategory_id', LTD_CONSTANTS.SUBCATEGORY_ID)

    // Apply visibility filters based on user role (same logic as document-library/list)
    if (!userProfile.role_type || userProfile.role_type.toLowerCase() !== 'admin') {
      // For non-admins, filter by visibility rules
      const userRoleType = userProfile.role_type || ''
      const { data: roleMatchDocs } = userRoleType ? await supabase
        .from('document_visibility')
        .select('document_id')
        .eq('conditions->>role_type', userRoleType) : { data: [] }
      
      const { data: noRoleDocs } = await supabase
        .from('document_visibility')
        .select('document_id')
        .is('conditions->>role_type', null)
      
      const roleDocIds = (roleMatchDocs || [])
        .map(d => d.document_id)
        .filter((id): id is string => id !== null && id !== undefined)
      
      const noRoleDocIds = (noRoleDocs || [])
        .map(d => d.document_id)
        .filter((id): id is string => id !== null && id !== undefined)
      
      const visibleDocIds = [...roleDocIds, ...noRoleDocIds]
      
      if (visibleDocIds.length > 0) {
        query = query.in('id', visibleDocIds)
      } else {
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

    // Get total count with same filters
    let countQuery = supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('document_category_id', LTD_CONSTANTS.CATEGORY_ID)
      .eq('document_subcategory_id', LTD_CONSTANTS.SUBCATEGORY_ID)

    // Apply same visibility filters to count query
    if (!userProfile.role_type || userProfile.role_type.toLowerCase() !== 'admin') {
      const userRoleType = userProfile.role_type || ''
      const { data: roleMatchDocs } = userRoleType ? await supabase
        .from('document_visibility')
        .select('document_id')
        .eq('conditions->>role_type', userRoleType) : { data: [] }
      
      const { data: noRoleDocs } = await supabase
        .from('document_visibility')
        .select('document_id')
        .is('conditions->>role_type', null)
      
      const visibleDocIds = [
        ...(roleMatchDocs || []).map(d => d.document_id).filter((id): id is string => id !== null && id !== undefined),
        ...(noRoleDocs || []).map(d => d.document_id).filter((id): id is string => id !== null && id !== undefined)
      ]
      
      if (visibleDocIds.length > 0) {
        countQuery = countQuery.in('id', visibleDocIds)
      }
    }

    const { count: _count, error: countError } = await countQuery
    
    if (countError) {
      console.error('Error getting LTD document count:', countError)
      return NextResponse.json(
        { success: false, error: `Failed to get document count: ${countError.message}` },
        { status: 500 }
      )
    }

    // Execute the main query to get all documents first (we'll sort and paginate in memory)
    const { data: allData, error } = await query

    if (error) {
      console.error('Error fetching LTD documents:', error)
      return NextResponse.json(
        { success: false, error: `Failed to fetch documents: ${error.message}` },
        { status: 500 }
      )
    }

    // Process the data to clean structure
    const processedData = allData.map(doc => {
      // Format tags
      const formattedTags = doc.tags
        ? doc.tags
            .filter((t: { tag: { id: string; name: string } | null }) => t.tag !== null)
            .map((t: { tag: { id: string; name: string } | null }) => {
              if (!t.tag) return null
              return {
                id: t.tag.id,
                name: t.tag.name
              }
            })
            .filter(Boolean)
        : []

      // Get custom metadata (should be only one for leadership_training_deck type)
      const customMetadata = Array.isArray(doc.custom_metadata) ? doc.custom_metadata.find(
        (metadata: any) => metadata.metadata_type === LTD_CONSTANTS.METADATA_TYPE
      ) || null : null

      return {
        id: doc.id,
        title: doc.title,
        description: doc.description,
        category: doc.category,
        subcategory: doc.subcategory,
        summary: doc.summary,
        tags: formattedTags,
        uploadedBy: doc.uploaded_by_user,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
        customMetadata
      }
    })

    // Sort the processed data: no meeting date first, then most recent meeting date to oldest
    const sortedData = processedData.sort((a, b) => {
      const aDate = a.customMetadata?.meeting_date
      const bDate = b.customMetadata?.meeting_date

      // If neither has a meeting date, sort by updated_at (newest first)
      if (!aDate && !bDate) {
        return new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime()
      }

      // If only a has no meeting date, a comes first
      if (!aDate && bDate) {
        return -1
      }

      // If only b has no meeting date, b comes first  
      if (aDate && !bDate) {
        return 1
      }

      // Both have meeting dates, sort by meeting date (most recent first)
      if (aDate && bDate) {
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      }

      return 0
    })

    // Apply pagination to sorted data
    const paginatedData = sortedData.slice(offset, offset + limit)

    // Use the actual sorted data length for total count
    const total = sortedData.length

    return NextResponse.json({
      success: true,
      data: paginatedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
    
  } catch (error) {
    console.error('Error in LTD documents API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}