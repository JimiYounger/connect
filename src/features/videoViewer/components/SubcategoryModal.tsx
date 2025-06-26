'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { X, Play, Clock, Calendar, CheckCircle, Search } from 'lucide-react'
import { VideoLibraryService } from '@/features/videoViewer/services/videoLibraryService'
import { WatchTrackingService } from '@/features/videoViewer/services/watchTrackingService'
import type { VideoForViewing, VideoWatchProgress } from '@/features/videoViewer/types'
import type { UserPermissions } from '@/features/permissions/types'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/context/auth-context'
import { useProfile } from '@/features/users/hooks/useProfile'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { getVideoThumbnailUrl } from '@/features/videoLibrary/utils/thumbnailUtils'

interface VideoSubcategory {
  id: string
  name: string
  thumbnailUrl?: string
  thumbnailColor?: string
  videoCount: number
}

interface SubcategoryModalProps {
  subcategory: VideoSubcategory
  isOpen: boolean
  onClose: () => void
  userPermissions: UserPermissions | null
}

export function SubcategoryModal({ subcategory, isOpen, onClose, userPermissions }: SubcategoryModalProps) {
  const router = useRouter()
  const { session } = useAuth()
  const { profile } = useProfile(session)
  const [videos, setVideos] = useState<VideoForViewing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [watchProgress, setWatchProgress] = useState<Map<string, VideoWatchProgress>>(new Map())
  const [searchQuery, setSearchQuery] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentOffset, setCurrentOffset] = useState(0)
  const [totalCount, setTotalCount] = useState<number | null>(null)

  // Animation states
  const [isAnimating, setIsAnimating] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  // Handle modal animation
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      // Small delay to ensure the modal is rendered before animating
      setTimeout(() => setIsAnimating(true), 10)
    } else {
      setIsAnimating(false)
      // Delay unmounting until animation completes
      setTimeout(() => setShouldRender(false), 300)
    }
  }, [isOpen])

  // Handle close with animation
  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => onClose(), 300)
  }

  // Load initial videos and count
  const loadInitialVideos = useCallback(async () => {
    if (!isOpen || !userPermissions) return

    try {
      setLoading(true)
      setError(null)
      setCurrentOffset(0)
      setVideos([])
      setWatchProgress(new Map())
      
      // Load videos and count in parallel
      const [videosResult, countResult] = await Promise.all([
        VideoLibraryService.getVideosForSubcategory(
          subcategory.id,
          userPermissions,
          100, // Larger initial batch size
          0
        ),
        VideoLibraryService.getSubcategoryVideoCount(subcategory.id)
      ])
      
      setVideos(videosResult)
      setTotalCount(countResult)
      setHasMore(videosResult.length === 100 && countResult > 100)
      setCurrentOffset(100)
      
      // Load watch progress for initial videos
      if (profile?.id && videosResult.length > 0) {
        try {
          const videoFileIds = videosResult.map(v => v.id)
          const progressData = await WatchTrackingService.getUserWatchHistory(profile.id, videoFileIds)
          
          const progressMap = new Map<string, VideoWatchProgress>()
          progressData.forEach(progress => {
            progressMap.set(progress.videoFileId, progress)
          })
          setWatchProgress(progressMap)
        } catch (progressErr) {
          console.error('Error loading watch progress:', progressErr)
        }
      }
    } catch (err) {
      console.error('Error loading videos:', err)
      setError('Failed to load videos')
    } finally {
      setLoading(false)
    }
  }, [isOpen, subcategory.id, userPermissions, profile?.id])

  // Load more videos (pagination)
  const loadMoreVideos = useCallback(async () => {
    if (loadingMore || !hasMore || !userPermissions) return

    try {
      setLoadingMore(true)
      
      const moreVideos = await VideoLibraryService.getVideosForSubcategory(
        subcategory.id,
        userPermissions,
        50,
        currentOffset
      )
      
      if (moreVideos.length > 0) {
        setVideos(prev => [...prev, ...moreVideos])
        setCurrentOffset(prev => prev + moreVideos.length)
        
        // Skip individual watch progress loading - will load all at once when done
        // Progress will be loaded in batch after all videos are loaded
      }
      
      setHasMore(moreVideos.length === 50 && (totalCount === null || videos.length + moreVideos.length < totalCount))
    } catch (err) {
      console.error('Error loading more videos:', err)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, userPermissions, subcategory.id, currentOffset, totalCount, videos.length])

  // Infinite scroll implementation
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || loadingMore || !hasMore) return
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    // Load more when user scrolls to within 200px of bottom
    if (scrollHeight - scrollTop - clientHeight < 200) {
      loadMoreVideos()
    }
  }, [loadMoreVideos, loadingMore, hasMore])
  
  useEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement) return
    
    scrollElement.addEventListener('scroll', handleScroll)
    return () => scrollElement.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  useEffect(() => {
    loadInitialVideos()
  }, [loadInitialVideos])

  // Auto-load all remaining videos after initial load
  useEffect(() => {
    const autoLoadAll = async () => {
      if (!hasMore || loading || loadingMore || !userPermissions) return
      
      // Small delay to let the UI render the initial videos
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Continue loading until all videos are loaded
      while (hasMore && !loadingMore) {
        await loadMoreVideos()
        // Small delay between batches to avoid overwhelming the UI
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
    
    autoLoadAll()
  }, [hasMore, loading, loadingMore, userPermissions, loadMoreVideos])

  // Load watch progress for all videos at once (after all videos are loaded)
  useEffect(() => {
    const loadAllWatchProgress = async () => {
      if (!profile?.id || videos.length === 0 || hasMore || watchProgress.size > 0) return
      
      try {
        const allVideoIds = videos.map(v => v.id)
        const progressData = await WatchTrackingService.getUserWatchHistory(profile.id, allVideoIds)
        
        const progressMap = new Map<string, VideoWatchProgress>()
        progressData.forEach(progress => {
          progressMap.set(progress.videoFileId, progress)
        })
        setWatchProgress(progressMap)
      } catch (err) {
        console.error('Error loading all watch progress:', err)
      }
    }
    
    loadAllWatchProgress()
  }, [profile?.id, videos, hasMore, watchProgress.size])

  const handleVideoClick = (video: VideoForViewing, event?: React.MouseEvent) => {
    console.log('SubcategoryModal - Video clicked:', video.id, video.title)
    console.log('SubcategoryModal - Event:', event)
    console.log('SubcategoryModal - Router:', router)
    console.log('SubcategoryModal - Navigating to:', `/videos/${video.id}`)
    
    try {
      // Add search parameter to track that user came from subcategory modal
      router.push(`/videos/${video.id}?from=subcategory&subcategoryId=${subcategory.id}&subcategoryName=${encodeURIComponent(subcategory.name)}`)
      console.log('SubcategoryModal - router.push called successfully')
    } catch (error) {
      console.error('SubcategoryModal - Error calling router.push:', error)
    }
  }

  // Filter videos based on search query
  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return videos
    
    const query = searchQuery.toLowerCase().trim()
    return videos.filter(video => 
      video.title.toLowerCase().includes(query) ||
      video.description?.toLowerCase().includes(query) ||
      video.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  }, [videos, searchQuery])

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!shouldRender) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center">
      {/* Modal Container */}
      <div 
        className={`bg-black w-full h-full overflow-hidden transition-transform duration-300 ease-out ${
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{subcategory.name}</h2>
              <p className="text-gray-400 mt-1">
                {loading ? 'Loading...' : (
                  <>
                    {filteredVideos.length}
                    {totalCount !== null && totalCount !== videos.length && ` of ${totalCount}`}
                    {searchQuery && filteredVideos.length !== videos.length ? ' (filtered)' : ' video' + (filteredVideos.length !== 1 ? 's' : '')}
                    {!searchQuery && videos.length < (totalCount || 0) && ` (showing first ${videos.length})`}
                    {watchProgress.size > 0 && (
                      <span className="ml-2">
                        • {Array.from(watchProgress.values()).filter(p => p.completed).length} completed
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-gray-900 hover:bg-gray-800 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div ref={scrollRef} className="p-6 overflow-y-auto h-[calc(100vh-180px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400">{error}</p>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">
                {searchQuery ? 'No videos found matching your search.' : 'No videos available.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVideos.map((video) => {
                const progress = watchProgress.get(video.id)
                const isCompleted = progress?.completed || false
                const percentComplete = progress?.percentComplete || 0
                
                return (
                  <motion.div
                    key={video.id}
                    onClick={(e) => handleVideoClick(video, e)}
                    className="flex gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-gray-900 hover:bg-gray-800 cursor-pointer transition-colors group"
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                  {/* Video Thumbnail */}
                  <div className="relative flex-none w-24 sm:w-32 md:w-40 aspect-video rounded-lg overflow-hidden bg-gray-700">
                    {(() => {
                      const thumbnailUrl = getVideoThumbnailUrl({
                        thumbnailSource: video.thumbnailSource,
                        customThumbnailUrl: video.customThumbnailUrl,
                        vimeoThumbnailUrl: video.vimeoThumbnailUrl
                      })
                      
                      return thumbnailUrl ? (
                        <Image
                          src={thumbnailUrl}
                          alt={video.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, 160px"
                          quality={90}
                          priority={false}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                          <Play className="w-6 md:w-8 h-6 md:h-8 text-white opacity-80" />
                        </div>
                      )
                    })()}
                    
                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-8 md:w-10 h-8 md:h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Play className="w-4 md:w-5 h-4 md:h-5 text-white ml-0.5" />
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {percentComplete > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${percentComplete}%` }}
                        />
                      </div>
                    )}

                    {/* Completion Badge */}
                    {isCompleted && (
                      <div className="absolute top-1 md:top-2 left-1 md:left-2 bg-green-600 rounded-full p-0.5 md:p-1">
                        <CheckCircle className="w-2.5 md:w-3 h-2.5 md:h-3 text-white" />
                      </div>
                    )}

                    {/* Duration Badge */}
                    {video.vimeoDuration && (
                      <div className="absolute bottom-1 md:bottom-2 right-1 md:right-2 bg-black/60 backdrop-blur-sm rounded px-1.5 md:px-2 py-0.5 md:py-1">
                        <span className="text-white text-xs font-medium">
                          {formatDuration(video.vimeoDuration)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-base md:text-lg leading-tight mb-1 md:mb-2 line-clamp-2">
                      {video.title}
                    </h3>
                    
                    {/* Progress Status - Mobile First */}
                    <div className="mb-2 md:mb-3">
                      {isCompleted ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-600/20 rounded-full text-green-400 text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          <span>Completed</span>
                        </div>
                      ) : percentComplete > 0 ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-600/20 rounded-full text-blue-400 text-xs font-medium">
                          <Play className="w-3 h-3" />
                          <span>{Math.round(percentComplete)}% watched</span>
                        </div>
                      ) : null}
                    </div>
                    
                    {video.description && (
                      <p className="text-gray-400 text-xs md:text-sm leading-relaxed mb-2 md:mb-3 line-clamp-2 md:line-clamp-3">
                        {video.description}
                      </p>
                    )}

                    {/* Metadata - Mobile Friendly */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      {video.vimeoDuration && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDuration(video.vimeoDuration)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
                )
              })}
              
              {/* Loading More Indicator */}
              {loadingMore && (
                <div className="text-center py-6">
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                    Loading more videos...
                  </div>
                </div>
              )}
              
              {/* End of list indicator */}
              {!hasMore && videos.length > 0 && !searchQuery && (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">
                    {totalCount !== null ? `All ${totalCount} videos loaded` : 'All videos loaded'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}