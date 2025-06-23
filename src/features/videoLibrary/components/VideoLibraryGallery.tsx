'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useDebounce } from '../../../hooks/use-debounce'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from "lucide-react"
import Image from "next/image"

interface VideoFile {
  id: string;
  title: string;
  description: string | null;
  vimeo_thumbnail_url: string | null;
  custom_thumbnail_url: string | null;
  preview_image_url: string | null;
  vimeo_duration: number | null;
}

interface VideoLibraryGalleryProps {
  onVideoSelect: (video: {
    id: string;
    title: string;
  }) => void;
  selectedVideoId?: string;
}

export function VideoLibraryGallery({ onVideoSelect, selectedVideoId }: VideoLibraryGalleryProps) {
  const [videos, setVideos] = useState<VideoFile[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const debouncedSearch = useDebounce(searchQuery, 500)
  
  // Create supabase client once
  const supabase = useMemo(() => createClient(), [])

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
        
        const perPage = 8
        const offset = (page - 1) * perPage
        
        let query = supabase
          .from('video_files')
          .select('id, title, description, vimeo_thumbnail_url, custom_thumbnail_url, preview_image_url, vimeo_duration', { count: 'exact' })
          .eq('admin_selected', true)
          .order('created_at', { ascending: false })
          .range(offset, offset + perPage - 1)

        if (debouncedSearch) {
          query = query.or(`title.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%`)
        }

        const { data, error: fetchError, count } = await query

        if (fetchError) {
          throw fetchError
        }

        setVideos(data || [])
        setTotalPages(Math.ceil((count || 0) / perPage))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch videos')
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [page, debouncedSearch, supabase])

  const handleVideoClick = (video: VideoFile) => {
    onVideoSelect({
      id: video.id,
      title: video.title
    })
  }

  const getThumbnailUrl = (video: VideoFile) => {
    return video.custom_thumbnail_url || 
           video.preview_image_url || 
           video.vimeo_thumbnail_url ||
           '/placeholder-video.jpg'
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
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
            const isSelected = video.id === selectedVideoId
            
            return (
              <div
                key={video.id}
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
                    <Image
                      src={getThumbnailUrl(video)}
                      alt={video.title}
                      width={240}
                      height={135}
                      className="w-full h-full object-cover"
                    />
                    {video.vimeo_duration && (
                      <div className="absolute bottom-0.5 right-0.5 bg-black/75 text-white px-1 py-0.5 rounded text-[10px]">
                        {formatDuration(video.vimeo_duration)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-medium text-gray-900 line-clamp-2">
                    {video.title}
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">
                    {video.description || 'No description'}
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
          
          <span className="text-xs text-gray-500">
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