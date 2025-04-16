'use client'

import { Suspense, useCallback, useMemo } from 'react'
import { DocumentViewer } from '@/features/documentLibrary/viewer/DocumentViewer'
import { UploadModal } from '@/features/documentLibrary/upload/UploadModal'
import { createClient } from '@/lib/supabase'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'

// Create a client
const queryClient = new QueryClient()

// Main component to load and display documents with data
function DocumentLibraryContent() {
  // Create a reference object we can pass to DocumentViewer to enable refetching
  const refetchRef = useMemo(() => ({ 
    refetch: () => {} // This will be set by the DocumentViewer component
  }), [])

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['documentCategories'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('document_categories')
        .select('id, name')
        .order('name')
      
      if (error) throw new Error(error.message)
      return data || []
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Fetch subcategories
  const { data: subcategories = [], isLoading: subcategoriesLoading } = useQuery({
    queryKey: ['documentSubcategories'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('document_subcategories')
        .select('id, name, document_category_id')
        .order('name')
      
      if (error) throw new Error(error.message)
      return data || []
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Fetch tags
  const { data: tags = [], isLoading: tagsLoading } = useQuery({
    queryKey: ['documentTags'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('document_tags')
        .select('id, name')
        .order('name')
      
      if (error) throw new Error(error.message)
      return data || []
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Handle successful upload
  const handleUploadSuccess = useCallback(() => {
    // Refetch documents from the viewer
    if (refetchRef && refetchRef.refetch) {
      refetchRef.refetch()
    }
    
    // No need to show toast here as UploadModal handles this
  }, [refetchRef])

  // Loading state
  const isLoading = categoriesLoading || tagsLoading || subcategoriesLoading
  
  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="md:col-span-2 h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-6 w-48 mb-2" />
        <div className="flex gap-1 mb-6">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    )
  }

  // Render viewer with data
  return (
    <div className="container mx-auto p-4">
      {/* Upload button and header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Document Library</h1>
        <UploadModal onUploadSuccess={handleUploadSuccess} />
      </div>

      {/* Document viewer */}
      <DocumentViewer 
        categories={categories} 
        subcategories={subcategories}
        availableTags={tags}
        isAdmin={true}
        onRefetchNeeded={refetchRef}
      />
    </div>
  )
}

// Document Library page component
export default function DocumentLibraryPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Suspense fallback={<div>Loading...</div>}>
          <DocumentLibraryContent />
        </Suspense>
      </div>
    </QueryClientProvider>
  )
}