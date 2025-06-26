'use client'

import { Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import SeriesManagement from '@/features/videoLibrary/components/series/SeriesManagement'

const queryClient = new QueryClient()

function SeriesPageContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center space-x-4">
            <Link href="/admin/video-library">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Series Management</h1>
              <p className="text-sm text-gray-600 mt-1">
                Create and manage video series with mixed content support
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }>
          <SeriesManagement />
        </Suspense>
      </div>
    </div>
  )
}

export default function SeriesPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <SeriesPageContent />
    </QueryClientProvider>
  )
}