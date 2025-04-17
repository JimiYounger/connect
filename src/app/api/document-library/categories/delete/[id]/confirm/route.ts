import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'

interface RequestBody {
  fallbackCategoryId: string
  documentOverrides: Record<string, string>
}

// Define an interface for the RPC function result
interface DeleteCategoryResult {
  documents_updated: number
  subcategories_updated: number
}

/**
 * POST - Confirm deletion of a category and reassign its documents
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: categoryId } = await params

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      )
    }

    // Get the authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has admin privileges
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role_type')
      .eq('user_id', user.id)
      .single()

    const isAdmin = userProfile?.role_type?.toLowerCase() === 'admin'

    // Only admins can delete categories
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin privileges required to delete categories' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: RequestBody = await request.json()
    const { fallbackCategoryId, documentOverrides = {} } = body

    // Validation
    if (!fallbackCategoryId) {
      return NextResponse.json(
        { success: false, error: 'Fallback category ID is required' },
        { status: 400 }
      )
    }

    if (categoryId === fallbackCategoryId) {
      return NextResponse.json(
        { success: false, error: 'Fallback category cannot be the same as the category being deleted' },
        { status: 400 }
      )
    }

    // Verify fallback category exists
    const { data: fallbackCategory, error: fallbackError } = await supabase
      .from('document_categories')
      .select('id')
      .eq('id', fallbackCategoryId)
      .single()

    if (fallbackError || !fallbackCategory) {
      return NextResponse.json(
        { success: false, error: 'Fallback category does not exist' },
        { status: 400 }
      )
    }

    // Use a PostgreSQL function to handle the transaction
    // This ensures either all operations succeed or all fail
    const { data, error: rpcError } = await supabase.rpc(
      'delete_category_and_reassign',
      {
        p_category_id: categoryId,
        p_fallback_category_id: fallbackCategoryId,
        p_document_overrides: documentOverrides
      }
    )

    // If RPC is not available, fallback to the step-by-step approach
    if (rpcError && rpcError.message.includes('function "delete_category_and_reassign" does not exist')) {
      console.warn('RPC function not available, falling back to step-by-step operations')
      return await handleStepByStep(supabase, categoryId, fallbackCategoryId, documentOverrides)
    } else if (rpcError) {
      console.error('Error in RPC transaction:', rpcError)
      return NextResponse.json(
        { success: false, error: `Transaction failed: ${rpcError.message}` },
        { status: 500 }
      )
    }

    // Safety check to ensure result is not null
    if (!data) {
      return NextResponse.json({
        success: false,
        error: 'Transaction completed but no result was returned'
      }, { status: 500 })
    }

    // Type assertion to match our expected structure
    const result = data as unknown as DeleteCategoryResult;

    // RPC function succeeded
    return NextResponse.json({
      success: true,
      message: 'Category deleted and documents reassigned successfully',
      reassignedDocuments: result.documents_updated,
      reassignedSubcategories: result.subcategories_updated
    })

  } catch (error) {
    console.error('Error in category deletion API:', error)
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
 * Fallback implementation when RPC is not available
 */
async function handleStepByStep(
  supabase: SupabaseClient,
  categoryId: string, 
  fallbackCategoryId: string, 
  documentOverrides: Record<string, string>
) {
  let documentsUpdatedCount = 0
  let overrideDocumentsCount = 0
  let subcategoriesUpdatedCount = 0

  // Step 1: Handle documents with overrides
  if (Object.keys(documentOverrides).length > 0) {
    for (const [documentId, newCategoryId] of Object.entries(documentOverrides)) {
      if (newCategoryId === categoryId) {
        return NextResponse.json(
          { success: false, error: 'Cannot reassign to the category being deleted' },
          { status: 400 }
        )
      }

      // Update individual document and get count
      const { error: overrideError } = await supabase
        .from('documents')
        .update({ document_category_id: newCategoryId })
        .eq('id', documentId)
        .eq('document_category_id', categoryId)

      if (overrideError) {
        return NextResponse.json(
          { success: false, error: `Failed to update document override: ${overrideError.message}` },
          { status: 500 }
        )
      }

      // Since we're updating a specific document with a specific ID,
      // if there's no error, we can assume 1 document was updated
      overrideDocumentsCount += 1
    }
  }

  // Step 2: Update remaining documents to fallback category
  const updateResult = await supabase
    .from('documents')
    .update({ document_category_id: fallbackCategoryId })
    .eq('document_category_id', categoryId)
    .not('id', 'in', Object.keys(documentOverrides))

  if (updateResult.error) {
    return NextResponse.json(
      { success: false, error: `Failed to update documents: ${updateResult.error.message}` },
      { status: 500 }
    )
  }

  // Get count after update
  const { data: updatedDocs, error: countError } = await supabase
    .from('documents')
    .select('id')
    .eq('document_category_id', fallbackCategoryId)
    
  if (countError) {
    console.error('Error getting count of updated documents:', countError)
  } else {
    documentsUpdatedCount = (updatedDocs?.length || 0) + overrideDocumentsCount
  }

  // Step 3: Reassign subcategories to fallback category
  const subcatResult = await supabase
    .from('document_subcategories')
    .update({ document_category_id: fallbackCategoryId })
    .eq('document_category_id', categoryId)

  if (subcatResult.error) {
    return NextResponse.json(
      { success: false, error: `Failed to update subcategories: ${subcatResult.error.message}` },
      { status: 500 }
    )
  }

  // Get count of subcategories
  const { data: updatedSubcats, error: subcatCountError } = await supabase
    .from('document_subcategories')
    .select('id')
    .eq('document_category_id', fallbackCategoryId)
    
  if (subcatCountError) {
    console.error('Error getting count of updated subcategories:', subcatCountError)
  } else {
    subcategoriesUpdatedCount = updatedSubcats?.length || 0
  }

  // Step 4: Delete the category
  const { error: deleteError } = await supabase
    .from('document_categories')
    .delete()
    .eq('id', categoryId)

  if (deleteError) {
    return NextResponse.json(
      { success: false, error: `Failed to delete category: ${deleteError.message}` },
      { status: 500 }
    )
  }

  // All operations successful
  return NextResponse.json({
    success: true,
    message: 'Category deleted and documents reassigned successfully',
    reassignedDocuments: documentsUpdatedCount,
    reassignedSubcategories: subcategoriesUpdatedCount
  })
} 