'use client'

import { useState, useEffect } from 'react'
import { VideoEditForm } from '@/features/videoLibrary/components/VideoEditForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface VideoEditPageProps {
  params: Promise<{ id: string }>
}

export default function VideoEditPage({ params }: VideoEditPageProps) {
  const [videoId, setVideoId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(({ id }) => {
      setVideoId(id)
      setLoading(false)
    })
  }, [params])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading video...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/video-library">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Library
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Video</h1>
        <p className="text-gray-600 mt-2">Update video details, categorization, and access permissions</p>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Video Details</CardTitle>
        </CardHeader>
        <CardContent>
          <VideoEditForm videoId={videoId} />
        </CardContent>
      </Card>
    </div>
  )
}