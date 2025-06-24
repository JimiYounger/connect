// src/features/analytics/components/VideoSearch.tsx

import React, { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Play, X } from 'lucide-react'
import Link from 'next/link'

interface Video {
  id: string
  title: string
  description?: string
  category?: string
  subcategory?: string
  duration?: number
}

interface VideoSearchProps {
  onVideoSelect?: (videoId: string) => void
  placeholder?: string
  showRecentlyAnalyzed?: boolean
}

export function VideoSearch({ onVideoSelect, placeholder, showRecentlyAnalyzed = true }: VideoSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [recentVideos, setRecentVideos] = useState<Video[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load recently analyzed videos from localStorage
  useEffect(() => {
    if (showRecentlyAnalyzed) {
      const recent = localStorage.getItem('recentlyAnalyzedVideos')
      if (recent) {
        try {
          setRecentVideos(JSON.parse(recent).slice(0, 5))
        } catch {
          setRecentVideos([])
        }
      }
    }
  }, [showRecentlyAnalyzed])

  // Search videos
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchVideos = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/video-library/search?q=${encodeURIComponent(query)}&limit=10`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setResults(data.data || [])
          }
        }
      } catch (error) {
        console.error('Error searching videos:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchVideos, 300)
    return () => clearTimeout(debounceTimer)
  }, [query])

  const handleVideoSelect = (video: Video) => {
    // Add to recently analyzed videos
    if (showRecentlyAnalyzed) {
      const recent = [video, ...recentVideos.filter(v => v.id !== video.id)].slice(0, 5)
      localStorage.setItem('recentlyAnalyzedVideos', JSON.stringify(recent))
      setRecentVideos(recent)
    }

    onVideoSelect?.(video.id)
    setQuery('')
    setIsOpen(false)
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    inputRef.current?.focus()
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Video Search</h3>
        <p className="text-sm text-gray-600">Search for videos to analyze</p>
      </div>

      <div ref={searchRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder || "Search videos..."}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            className="pl-10 pr-10"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown Results */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1 max-h-96 overflow-y-auto">
            {/* Search Results */}
            {query && (
              <div>
                {isLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-sm">Searching...</p>
                  </div>
                ) : results.length > 0 ? (
                  <div>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                      Search Results
                    </div>
                    {results.map((video) => (
                      <VideoItem
                        key={video.id}
                        video={video}
                        onSelect={handleVideoSelect}
                        formatDuration={formatDuration}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <p className="text-sm">No videos found for &ldquo;{query}&rdquo;</p>
                  </div>
                )}
              </div>
            )}

            {/* Recently Analyzed */}
            {!query && showRecentlyAnalyzed && recentVideos.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                  Recently Analyzed
                </div>
                {recentVideos.map((video) => (
                  <VideoItem
                    key={video.id}
                    video={video}
                    onSelect={handleVideoSelect}
                    formatDuration={formatDuration}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!query && (!showRecentlyAnalyzed || recentVideos.length === 0) && (
              <div className="p-4 text-center text-gray-500">
                <Play className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm">Start typing to search for videos</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex gap-2">
        <Link
          href="/admin/analytics/trending"
          className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
        >
          View Trending
        </Link>
        <Link
          href="/admin/analytics/engagement"
          className="px-3 py-2 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
        >
          Engagement Report
        </Link>
      </div>
    </Card>
  )
}

// Video Item Component
interface VideoItemProps {
  video: Video
  onSelect: (video: Video) => void
  formatDuration: (seconds: number) => string
}

function VideoItem({ video, onSelect, formatDuration }: VideoItemProps) {
  return (
    <div
      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
      onClick={() => onSelect(video)}
    >
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Play className="w-4 h-4 text-blue-600" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{video.title}</h4>
        <div className="flex items-center gap-2 mt-1">
          {video.category && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {video.category}
            </span>
          )}
          {video.duration && (
            <span className="text-xs text-gray-500">
              {formatDuration(video.duration)}
            </span>
          )}
        </div>
      </div>
      <div className="flex-shrink-0">
        <Link
          href={`/admin/analytics/video/${video.id}`}
          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          Analyze
        </Link>
      </div>
    </div>
  )
}