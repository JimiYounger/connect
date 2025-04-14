'use client'

import { Suspense } from 'react'
import { DocumentViewer } from '@/features/documentLibrary/viewer/DocumentViewer'
import { createClient } from '@/lib/supabase'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'

// Create a client
const queryClient = new QueryClient()

// Main component to load and display documents with data
function DocumentLibraryContent() {
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

  // Check admin role
  const { data: isAdmin = false, isLoading: adminCheckLoading } = useQuery({
    queryKey: ['userIsAdmin'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return false
      
      const { data } = await supabase
        .from('user_profiles')
        .select('role_type')
        .eq('user_id', user.id)
        .single()
      
      return data?.role_type === 'admin'
    },
    staleTime: 30 * 60 * 1000 // 30 minutes
  })

  // Loading state
  const isLoading = categoriesLoading || tagsLoading || adminCheckLoading
  
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
    <DocumentViewer 
      categories={categories} 
      availableTags={tags}
      isAdmin={isAdmin}
    />
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