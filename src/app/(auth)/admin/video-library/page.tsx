'use client'

import { Suspense, useMemo } from 'react'
import { VideoLibraryViewer } from '@/features/videoLibrary/viewer/VideoLibraryViewer'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'

// Create a client
const queryClient = new QueryClient()

// Main component to load and display videos with data
function VideoLibraryContent() {
  // Create a reference object we can pass to VideoLibraryViewer to enable refetching
  const refetchRef = useMemo(() => ({ 
    refetch: () => {} // This will be set by the VideoLibraryViewer component
  }), [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Video Library Administration</h1>
        <p className="text-gray-600 mt-2">Manage and curate video content from your Vimeo library</p>
      </div>
      
      <Suspense fallback={<VideoLibrarySkeleton />}>
        <VideoLibraryViewer refetchRef={refetchRef} />
      </Suspense>
    </div>
  );
}

// Loading skeleton component
function VideoLibrarySkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Filter skeleton */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
      
      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Main page component with QueryClient provider
export default function VideoLibraryPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <VideoLibraryContent />
    </QueryClientProvider>
  )
}