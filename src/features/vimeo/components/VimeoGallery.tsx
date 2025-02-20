'use client'

import { useState, useEffect } from 'react'
import { vimeoClient } from '../utils/vimeoClient'
import { useDebounce } from '../../../hooks/use-debounce'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Loader2 } from "lucide-react"
import type { VimeoVideo } from "@vimeo/vimeo"

interface VimeoGalleryProps {
  onVideoSelect: (video: {
    id: string;
    title: string;
  }) => void;
  selectedVideoId?: string;
}

export function VimeoGallery({ onVideoSelect, selectedVideoId }: VimeoGalleryProps) {
  const [videos, setVideos] = useState<VimeoVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const debouncedSearch = useDebounce(searchQuery, 500)

  useEffect(() => {
    if (searchQuery !== debouncedSearch) {
      setSearching(true)
    } else {
      setSearching(false)
    }
  }, [searchQuery, debouncedSearch])

  useEffect(() => {
    async function fetchVideos() {
      try {
        setLoading(true)
        setError(null)
        const response = await vimeoClient.getVideos({
          page,
          perPage: 8,
          query: debouncedSearch,
          sort: 'date'
        })
        setVideos(response.data)
        setTotalPages(Math.ceil(response.total / response.per_page))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch videos')
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [page, debouncedSearch])

  const handleVideoClick = (video: VimeoVideo) => {
    // Extract video ID from URI (format: /videos/123456789)
    const videoId = video.uri.split('/').pop() || ''
    
    onVideoSelect({
      id: videoId,
      title: video.name
    })
  }

  function getBestThumbnail(pictures: VimeoVideo['pictures']) {
    const sorted = pictures.sizes.sort((a: { width: number }, b: { width: number }) => a.width - b.width)
    const medium = sorted.find((size: { width: number }) => size.width >= 200 && size.width <= 300)
    return medium?.link || sorted[0].link
  }

  return (
    <div className="space-y-2">
      <Input
        type="text"
        placeholder={searching ? "Searching..." : "Search videos..."}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="h-8 text-sm"
      />

      {(loading || searching) && (
        <div className="flex justify-center items-center py-2">
          <div className="animate-spin">
            <Loader2 className="h-4 w-4 text-blue-500" />
          </div>
        </div>
      )}

      {error && (
        <div className="text-red-500 text-center py-1 text-xs">
          {error}
        </div>
      )}

      <div className={`max-h-[300px] overflow-y-auto rounded-md border transition-opacity duration-200 
        ${(loading || searching) ? 'opacity-50' : 'opacity-100'}`}>
        <div className="grid grid-cols-2 gap-1 p-1">
          {videos.map((video) => {
            const videoId = video.uri.split('/').pop() || ''
            const isSelected = videoId === selectedVideoId
            
            return (
              <div
                key={video.uri}
                onClick={() => handleVideoClick(video)}
                className={`
                  flex items-center gap-2 p-1 border rounded cursor-pointer transition-all
                  ${isSelected 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                  }
                `}
              >
                <div className="relative w-24 flex-shrink-0">
                  <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                    {video.pictures.sizes && (
                      <img
                        src={getBestThumbnail(video.pictures)}
                        alt={video.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute bottom-0.5 right-0.5 bg-black/75 text-white px-1 py-0.5 rounded text-[10px]">
                      {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                    </div>
                  </div>
                </div>
                
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-medium text-gray-900 line-clamp-2">
                    {video.name}
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {new Date(video.created_time).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {videos.length === 0 && !loading && !searching && (
        <div className="text-center py-4 text-sm text-gray-500">
          {searchQuery ? 'No videos found' : 'No videos available'}
        </div>
      )}

      {videos.length > 0 && (
        <div className="flex justify-between items-center gap-2 pt-1">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading || searching}
            variant="outline"
            size="sm"
            className="h-7 text-xs"
          >
            Previous
          </Button>
          <span className="text-xs text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading || searching}
            variant="outline"
            size="sm"
            className="h-7 text-xs"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}