'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Play, Clock, CheckCircle, Link as LinkIcon } from 'lucide-react'
import Image from 'next/image'
import { VideoPlayerModal } from '../VideoPlayerModal'
import type { ImportFormData, VimeoVideo } from '../VideoImportWizard'

interface VideoSelectionStepProps {
  formData: ImportFormData
  updateFormData: (updates: Partial<ImportFormData>) => void
}

export function VideoSelectionStep({ formData, updateFormData }: VideoSelectionStepProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [searchResults, setSearchResults] = useState<VimeoVideo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewVideo, setPreviewVideo] = useState<VimeoVideo | null>(null)

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const extractVimeoId = (url: string): string | null => {
    const patterns = [
      /vimeo\.com\/(\d+)/,
      /vimeo\.com\/video\/(\d+)/,
      /player\.vimeo\.com\/video\/(\d+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    
    // Check if it's just a number
    if (/^\d+$/.test(url.trim())) {
      return url.trim()
    }
    
    return null
  }

  const searchVimeoLibrary = useCallback(async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        per_page: '20'
      })
      
      const response = await fetch(`/api/video-library/vimeo/list?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.data) {
        // Transform the Vimeo API response to match our expected format
        const transformedVideos = data.data.map((video: any) => ({
          id: video.vimeoId,
          title: video.name,
          description: video.description || '',
          thumbnail_url: video.pictures?.thumbnail_url || '',
          duration: video.duration || 0,
          uri: video.uri
        }))
        setSearchResults(transformedVideos)
        setError(null)
      } else {
        setError(data.error || 'Search failed')
        setSearchResults([])
      }
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : 'Search failed')
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  const fetchVideoByUrl = useCallback(async () => {
    const vimeoId = extractVimeoId(urlInput)
    
    if (!vimeoId) {
      setError('Please enter a valid Vimeo URL or video ID')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/video-library/vimeo/video/${vimeoId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.video) {
        setSearchResults([data.video])
        setError(null)
      } else {
        setError(data.error || 'Video not found')
        setSearchResults([])
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch video')
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }, [urlInput])

  const selectVideo = (video: VimeoVideo) => {
    updateFormData({
      selectedVideo: video,
      videoDetails: {
        title: video.title,
        description: video.description,
        customThumbnailUrl: '',
        thumbnailSource: 'vimeo'
      }
    })
  }

  const openPreview = (video: VimeoVideo) => {
    setPreviewVideo(video)
  }

  const closePreview = () => {
    setPreviewVideo(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Your Video
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search">Search Library</TabsTrigger>
              <TabsTrigger value="url">Video URL/ID</TabsTrigger>
            </TabsList>
            
            <TabsContent value="search" className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Search your Vimeo library..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchVimeoLibrary()}
                  />
                </div>
                <Button 
                  onClick={searchVimeoLibrary}
                  disabled={loading || !searchQuery.trim()}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Search
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="url" className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Paste Vimeo URL or enter video ID..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchVideoByUrl()}
                  />
                </div>
                <Button 
                  onClick={fetchVideoByUrl}
                  disabled={loading || !urlInput.trim()}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <LinkIcon className="h-4 w-4" />
                  )}
                  Fetch
                </Button>
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Supported formats:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>https://vimeo.com/123456789</li>
                  <li>https://player.vimeo.com/video/123456789</li>
                  <li>123456789 (video ID only)</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800 font-medium">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Searching videos...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Video Display */}
      {formData.selectedVideo && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Selected Video
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Image
                src={formData.selectedVideo.thumbnail_url}
                alt={formData.selectedVideo.title}
                width={128}
                height={80}
                className="w-32 h-20 object-cover rounded-md flex-shrink-0"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-green-800">
                  {formData.selectedVideo.title}
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  {formData.selectedVideo.description}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-green-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(formData.selectedVideo.duration)}</span>
                  </div>
                  <div>ID: {formData.selectedVideo.id}</div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openPreview(formData.selectedVideo!)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFormData({ selectedVideo: null })}
                >
                  Change
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {!formData.selectedVideo && searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({searchResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.map((video) => (
                <Card key={video.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-video relative">
                    <Image
                      src={video.thumbnail_url}
                      alt={video.title}
                      width={400}
                      height={225}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openPreview(video)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                      {video.title}
                    </h3>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDuration(video.duration)}</span>
                      </div>
                      <span>ID: {video.id}</span>
                    </div>
                    
                    <Button
                      onClick={() => selectVideo(video)}
                      className="w-full"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Select Video
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video Preview Modal */}
      {previewVideo && (
        <VideoPlayerModal
          isOpen={!!previewVideo}
          onClose={closePreview}
          video={{
            id: previewVideo.id,
            title: previewVideo.title,
            description: previewVideo.description,
            vimeo_id: previewVideo.id,
            vimeo_duration: previewVideo.duration,
            vimeo_thumbnail_url: previewVideo.thumbnail_url
          }}
        />
      )}
    </div>
  )
}