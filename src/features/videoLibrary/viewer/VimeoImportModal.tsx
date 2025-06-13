'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Play,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCircle,
  ExternalLink,
  Clock
} from 'lucide-react'

interface VimeoVideo {
  vimeoId: string
  uri: string
  name: string
  description?: string
  duration: number
  created_time: string
  pictures?: {
    sizes: Array<{ link: string; width: number; height: number }>
  }
  link: string
  isImported: boolean
  adminSelected: boolean
  libraryStatus?: string
}

interface VimeoImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportSuccess: () => void
}

export function VimeoImportModal({ isOpen, onClose, onImportSuccess }: VimeoImportModalProps) {
  const [videos, setVideos] = useState<VimeoVideo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [importing, setImporting] = useState<Set<string>>(new Set())

  // Fetch Vimeo videos
  const fetchVimeoVideos = async (page = 1) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '12'
      })

      const response = await fetch(`/api/video-library/vimeo/list?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch Vimeo videos')
      }

      const data = await response.json()
      
      if (data.success) {
        setVideos(data.data || [])
        setCurrentPage(page)
        setTotalPages(Math.ceil(data.total / 12))
      } else {
        setError(data.error || 'Failed to fetch videos')
      }
    } catch (err) {
      console.error('Error fetching Vimeo videos:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Import video
  const importVideo = async (video: VimeoVideo) => {
    try {
      setImporting(prev => new Set(prev).add(video.vimeoId))

      const response = await fetch('/api/video-library/vimeo/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vimeoId: video.vimeoId,
          title: video.name,
          description: video.description
        })
      })

      if (!response.ok) {
        throw new Error('Failed to import video')
      }

      const data = await response.json()
      
      if (data.success) {
        // Update the video in our list to show it's imported
        setVideos(prev => prev.map(v => 
          v.vimeoId === video.vimeoId 
            ? { ...v, isImported: true, adminSelected: true }
            : v
        ))
        
        // Notify parent to refresh
        onImportSuccess()
      } else {
        throw new Error(data.error || 'Import failed')
      }
    } catch (err) {
      console.error('Error importing video:', err)
      alert(`Failed to import "${video.name}": ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setImporting(prev => {
        const newSet = new Set(prev)
        newSet.delete(video.vimeoId)
        return newSet
      })
    }
  }

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Get thumbnail URL
  const getThumbnailUrl = (video: VimeoVideo) => {
    if (!video.pictures?.sizes) return null
    // Get a medium-sized thumbnail
    const thumb = video.pictures.sizes.find(size => size.width >= 300) || video.pictures.sizes[0]
    return thumb?.link
  }

  // Initial load
  useEffect(() => {
    if (isOpen) {
      fetchVimeoVideos(1)
    }
  }, [isOpen])

  // Filter videos based on search
  const filteredVideos = videos.filter(video =>
    video.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (video.description && video.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Import Videos from Vimeo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchVimeoVideos(currentPage)}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading Vimeo videos...</p>
              </div>
            </div>
          )}

          {/* Videos grid */}
          {!loading && filteredVideos.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
                {filteredVideos.map((video) => (
                  <Card key={video.vimeoId} className="overflow-hidden">
                    <div className="relative">
                      {getThumbnailUrl(video) ? (
                        <Image
                          src={getThumbnailUrl(video) || ''}
                          alt={video.name}
                          width={400}
                          height={128}
                          className="w-full h-32 object-cover"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                          <Play className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      
                      {video.isImported && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Imported
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm line-clamp-2">{video.name}</h4>
                        
                        {video.description && (
                          <p className="text-xs text-gray-600 line-clamp-2">{video.description}</p>
                        )}

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(video.duration)}</span>
                        </div>

                        <div className="flex gap-2 pt-2">
                          {video.isImported ? (
                            <Badge variant="secondary" className="flex-1 justify-center">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Already Imported
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => importVideo(video)}
                              disabled={importing.has(video.vimeoId)}
                              className="flex-1"
                            >
                              {importing.has(video.vimeoId) ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                  Importing...
                                </>
                              ) : (
                                <>
                                  <Download className="h-3 w-3 mr-1" />
                                  Import
                                </>
                              )}
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(video.link, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchVimeoVideos(currentPage - 1)}
                    disabled={currentPage <= 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchVimeoVideos(currentPage + 1)}
                    disabled={currentPage >= totalPages || loading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredVideos.length === 0 && !error && (
            <div className="text-center py-12">
              <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Videos Found</h3>
              <p className="text-gray-600">
                {searchQuery ? 'Try adjusting your search terms' : 'No videos available in your Vimeo library'}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}