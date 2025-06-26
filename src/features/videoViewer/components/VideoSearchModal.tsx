'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Search, Play, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { UserPermissions } from '@/features/permissions/types'

interface SearchResult {
  id: string
  title: string
  description?: string
  vimeo_id?: string
  vimeo_duration?: number
  vimeo_thumbnail_url?: string
  custom_thumbnail_url?: string
  thumbnail_source?: 'vimeo' | 'upload' | 'url'
  similarity: number
  highlight: string
  matching_chunks: {
    chunk_index: number
    content: string
    similarity: number
    timestamp_start?: number
    timestamp_end?: number
  }[]
}

interface VideoSearchModalProps {
  isOpen: boolean
  onClose: () => void
  userPermissions: UserPermissions | null
}

export function VideoSearchModal({ isOpen, onClose, userPermissions: _userPermissions }: VideoSearchModalProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  // Animation states
  const [isAnimating, setIsAnimating] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // Handle modal animation
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      // Small delay to ensure the modal is rendered before animating
      setTimeout(() => setIsAnimating(true), 10)
    } else {
      setIsAnimating(false)
      // Delay unmounting until animation completes
      setTimeout(() => setShouldRender(false), 400)
    }
  }, [isOpen])

  // Handle close with animation
  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => onClose(), 400)
  }

  const performSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const response = await fetch('/api/video-library/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          match_threshold: 0.3,
          match_count: 10,
          log_search: true
        })
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setResults(data.results || [])
        setError(null)
      } else {
        setError(data.error || 'Search failed')
      }
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleVideoClick = (video: SearchResult, event?: React.MouseEvent) => {
    console.log('VideoSearchModal - Video clicked:', video.id, video.title)
    console.log('VideoSearchModal - Event:', event)
    console.log('VideoSearchModal - Router:', router)
    console.log('VideoSearchModal - Navigating to:', `/videos/${video.id}`)
    
    try {
      // Add search parameter to track that user came from search modal
      router.push(`/videos/${video.id}?from=search&query=${encodeURIComponent(query)}`)
      console.log('VideoSearchModal - router.push called successfully')
    } catch (error) {
      console.error('VideoSearchModal - Error calling router.push:', error)
    }
    onClose()
  }

  const getVideoThumbnail = (result: SearchResult) => {
    if (result.thumbnail_source === 'upload' && result.custom_thumbnail_url) {
      return result.custom_thumbnail_url
    }
    if (result.thumbnail_source === 'url' && result.custom_thumbnail_url) {
      return result.custom_thumbnail_url
    }
    if (result.vimeo_thumbnail_url) {
      return result.vimeo_thumbnail_url
    }
    return null
  }

  if (!shouldRender) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop with fade */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-400 ease-out ${
          isAnimating ? 'opacity-95' : 'opacity-0'
        }`} 
        style={{ backdropFilter: 'blur(8px)' }}
      />
      
      {/* Modal Container with emergence animation */}
      <div 
        ref={modalRef}
        className={`absolute bg-black transition-all duration-400 ease-out ${
          isAnimating 
            ? 'inset-0 rounded-none opacity-100 scale-100' 
            : 'top-[140px] left-4 right-4 max-w-2xl mx-auto h-[60px] rounded-xl opacity-0 scale-95'
        }`}
        style={{
          transformOrigin: isAnimating ? 'center' : 'top center',
          willChange: 'transform, opacity',
        }}
      >
        {/* Only show content when animating (expanded) */}
        <div className={`h-full flex flex-col transition-opacity duration-200 ${
          isAnimating ? 'opacity-100 delay-150' : 'opacity-0'
        }`}>
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-800 bg-black sticky top-0 z-10">
            <div className="flex items-center gap-2 md:gap-3">
              <Search className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
              <h2 className="text-lg md:text-2xl font-bold text-white">Search Videos</h2>
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-gray-900 hover:bg-gray-800 flex items-center justify-center transition-colors active:scale-95"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Search Input */}
          <div className="p-4 md:p-6 border-b border-gray-800 bg-black sticky top-[73px] md:static z-10">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Search for videos..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                className="flex-1 px-4 py-3 md:py-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-white focus:outline-none text-base"
                autoFocus
              />
              <button
                onClick={performSearch}
                disabled={loading || !query.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium active:scale-95 min-h-[48px]"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 md:p-6">
            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-400">Searching...</p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-center py-16">
                <p className="text-red-400 px-4">{error}</p>
              </div>
            )}

            {/* No Results */}
            {!loading && hasSearched && results.length === 0 && !error && (
              <div className="text-center py-16">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Results Found</h3>
                <p className="text-gray-400 px-4">
                  Try adjusting your search terms or using different keywords.
                </p>
              </div>
            )}

            {/* Search Results */}
            {results.length > 0 && (
              <div className="space-y-3 md:space-y-4">
                <p className="text-gray-400 text-sm px-1">Found {results.length} videos</p>
                
                {results.map((result) => (
                  <motion.div
                    key={result.id}
                    onClick={(e) => handleVideoClick(result, e)}
                    className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 md:p-4 rounded-xl bg-gray-900 hover:bg-gray-800 active:bg-gray-700 cursor-pointer transition-colors group"
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    {/* Video Thumbnail */}
                    <div className="relative flex-none w-full sm:w-32 md:w-40 aspect-video rounded-lg overflow-hidden bg-gray-700">
                      {getVideoThumbnail(result) ? (
                        <Image
                          src={getVideoThumbnail(result)!}
                          alt={result.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 128px, 160px"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                          <Play className="w-6 h-6 md:w-8 md:h-8 text-white opacity-80" />
                        </div>
                      )}
                      
                      {/* Play Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                          <Play className="w-6 h-6 md:w-5 md:h-5 text-white ml-0.5" />
                        </div>
                      </div>

                      {/* Duration Badge */}
                      {result.vimeo_duration && (
                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1">
                          <span className="text-white text-xs font-medium">
                            {formatDuration(result.vimeo_duration)}
                          </span>
                        </div>
                      )}

                    </div>

                    {/* Video Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-base md:text-lg leading-tight mb-2 line-clamp-2">
                        {result.title}
                      </h3>
                      
                      {result.description && (
                        <p className="text-gray-400 text-sm leading-relaxed mb-3 line-clamp-2">
                          {result.description}
                        </p>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {result.vimeo_duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDuration(result.vimeo_duration)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}