'use client'

import { Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import SeriesDetailView from '@/features/videoLibrary/components/series/SeriesDetailView'

const queryClient = new QueryClient()

interface SeriesDetailPageProps {
  params: Promise<{ id: string }>
}

function SeriesDetailContent({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center space-x-4">
            <Link href="/admin/video-library/series">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Series Details</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage content and settings for this series
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
          <SeriesDetailView params={params} />
        </Suspense>
      </div>
    </div>
  )
}

export default function SeriesDetailPage({ params }: SeriesDetailPageProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SeriesDetailContent params={params} />
    </QueryClientProvider>
  )
}