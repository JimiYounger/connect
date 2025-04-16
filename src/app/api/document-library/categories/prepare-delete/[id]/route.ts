import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

/**
 * GET - Prepare for category deletion by retrieving affected documents and available categories
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = params.id

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

    // 1. Fetch documents that have this category ID
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('id, title, document_category_id')
      .eq('document_category_id', categoryId)
      .order('title') // Sort documents by title for better user experience

    if (documentsError) {
      console.error('Error fetching documents:', documentsError)
      return NextResponse.json(
        { success: false, error: `Failed to fetch documents: ${documentsError.message}` },
        { status: 500 }
      )
    }

    // 2. Fetch all categories
    const { data: allCategories, error: categoriesError } = await supabase
      .from('document_categories')
      .select('id, name')
      .order('name')

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
      return NextResponse.json(
        { success: false, error: `Failed to fetch categories: ${categoriesError.message}` },
        { status: 500 }
      )
    }

    // 3. Determine if we can delete this category
    const canDelete = allCategories.length > 1

    // 4. Process categories for reassignment
    // Separate this logic to make it easier to extend for subcategory support later
    const processedDocuments = documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      current_category_id: doc.document_category_id
    }))
    
    // Filter out the current category from available categories
    // Extracted as a separate variable to make it easier to add subcategory support later
    const availableCategories = allCategories
      .filter(category => category.id !== categoryId)
      .map(cat => ({
        id: cat.id,
        name: cat.name
      }))

    return NextResponse.json({
      success: true,
      data: {
        categoryId,
        documents: processedDocuments,
        availableCategories,
        canDelete
      }
    })
  } catch (error) {
    console.error('Error in prepare category deletion API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
} 