'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Play,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Download,
  ExternalLink
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { VimeoImportModal } from './VimeoImportModal'

interface VideoFile {
  id: string
  title: string
  description?: string
  vimeoId?: string
  vimeoUri?: string
  vimeoDuration?: number
  vimeoThumbnailUrl?: string
  category?: { id: string; name: string }
  subcategory?: { id: string; name: string }
  series?: { id: string; name: string }
  adminSelected: boolean
  libraryStatus: 'pending' | 'processing' | 'completed' | 'error'
  transcriptStatus: 'pending' | 'processing' | 'completed' | 'error'
  embeddingStatus: 'pending' | 'processing' | 'completed' | 'error'
  summaryStatus: 'pending' | 'processing' | 'completed' | 'error'
  createdAt: string
  updatedAt: string
  chunksCount: number
}

interface VideoLibraryViewerProps {
  refetchRef: { refetch: () => void }
}

export function VideoLibraryViewer({ refetchRef }: VideoLibraryViewerProps) {
  const [videos, setVideos] = useState<VideoFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showImportModal, setShowImportModal] = useState(false)

  // Fetch videos
  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/video-library/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchQuery: searchQuery || undefined,
          library_status: statusFilter !== 'all' ? statusFilter : undefined,
          limit: 50
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch videos: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setVideos(data.data || [])
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch videos')
      }
    } catch (err) {
      console.error('Error fetching videos:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, statusFilter])

  // Set up refetch function
  useEffect(() => {
    refetchRef.refetch = fetchVideos
  }, [refetchRef, fetchVideos])

  // Initial fetch
  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  // Process video (trigger transcript extraction, etc.)
  const processVideo = async (videoId: string) => {
    try {
      const response = await fetch('/api/video-library/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoFileId: videoId })
      })

      if (!response.ok) {
        throw new Error('Failed to process video')
      }

      // Refresh the list
      fetchVideos()
    } catch (err) {
      console.error('Error processing video:', err)
      alert('Failed to process video')
    }
  }

  // Get status badge props
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, className: 'bg-green-100 text-green-800', text: 'Completed' }
      case 'processing':
        return { icon: Clock, className: 'bg-yellow-100 text-yellow-800', text: 'Processing' }
      case 'error':
        return { icon: XCircle, className: 'bg-red-100 text-red-800', text: 'Error' }
      case 'pending':
      default:
        return { icon: AlertCircle, className: 'bg-gray-100 text-gray-800', text: 'Pending' }
    }
  }

  // Format duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading && videos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading videos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Videos</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchVideos}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-4 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={() => setShowImportModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Import from Vimeo
        </Button>
      </div>

      {/* Videos Grid */}
      {videos.length === 0 ? (
        <div className="text-center py-12">
          <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Videos Found</h3>
          <p className="text-gray-600 mb-4">Get started by importing videos from your Vimeo library</p>
          <Button onClick={() => setShowImportModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Import from Vimeo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => {
            const libraryBadge = getStatusBadge(video.libraryStatus)
            const transcriptBadge = getStatusBadge(video.transcriptStatus)
            const embeddingBadge = getStatusBadge(video.embeddingStatus)
            
            return (
              <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="p-0">
                  {video.vimeoThumbnailUrl ? (
                    <img
                      src={video.vimeoThumbnailUrl}
                      alt={video.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <Play className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-2">{video.title}</h3>
                      {video.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">{video.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(video.vimeoDuration)}</span>
                      {video.chunksCount > 0 && (
                        <>
                          <span>•</span>
                          <span>{video.chunksCount} chunks</span>
                        </>
                      )}
                    </div>

                    {/* Status badges */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge className={libraryBadge.className} variant="secondary">
                          <libraryBadge.icon className="h-3 w-3 mr-1" />
                          Library: {libraryBadge.text}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Badge className={transcriptBadge.className} variant="secondary">
                          <transcriptBadge.icon className="h-3 w-3 mr-1" />
                          Transcript: {transcriptBadge.text}
                        </Badge>
                        
                        <Badge className={embeddingBadge.className} variant="secondary">
                          <embeddingBadge.icon className="h-3 w-3 mr-1" />
                          Embedding: {embeddingBadge.text}
                        </Badge>
                      </div>
                    </div>

                    {/* Category/Series info */}
                    {(video.category || video.series) && (
                      <div className="text-sm text-gray-600">
                        {video.category && <span>Category: {video.category.name}</span>}
                        {video.category && video.series && <span> • </span>}
                        {video.series && <span>Series: {video.series.name}</span>}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {video.transcriptStatus === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => processVideo(video.id)}
                          className="flex-1"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Process
                        </Button>
                      )}
                      
                      {video.vimeoId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`https://vimeo.com/${video.vimeoId}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <VimeoImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImportSuccess={fetchVideos}
        />
      )}
    </div>
  )
}