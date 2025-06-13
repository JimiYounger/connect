'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { VideoImportWizard } from '@/features/videoLibrary/components/VideoImportWizard'

export default function VideoImportPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" asChild>
          <Link href="/admin/video-library">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Video Library
          </Link>
        </Button>
      </div>
      
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Import Video from Vimeo</h1>
        <p className="text-gray-600">Search and import videos with automatic processing and categorization</p>
      </div>

      <VideoImportWizard />
    </div>
  )
}