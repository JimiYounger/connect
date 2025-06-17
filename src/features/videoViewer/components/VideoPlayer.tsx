'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Share, Bookmark, MoreVertical } from 'lucide-react'
import type { VideoForViewing } from '../types'

interface VideoPlayerProps {
  video: VideoForViewing
  onBack?: () => void
  profile?: any
}

export function VideoPlayer({ video, onBack, profile }: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resumePosition, setResumePosition] = useState(0)
  const [showActions, setShowActions] = useState(false)
  
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const saveProgressRef = useRef<(position: number) => void>(() => {})

  // Simple progress tracking
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const response = await fetch('/api/video-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get',
            videoId: video.id,
            userId: profile?.id
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.position > 10) { // Only resume if more than 10 seconds watched
            setResumePosition(data.position)
          }
        }
      } catch (err) {
        console.log('Could not load progress:', err)
      }
    }
    
    if (profile?.id) {
      loadProgress()
    }
  }, [video.id, profile?.id])

  // Save progress function
  const saveProgress = async (position: number) => {
    if (!profile?.id || position < 5) return
    
    try {
      await fetch('/api/video-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          videoId: video.id,
          userId: profile.id,
          position,
          duration: video.vimeoDuration || 0
        })
      })
    } catch (err) {
      console.log('Could not save progress:', err)
    }
  }

  saveProgressRef.current = saveProgress

  // Initialize Vimeo player
  useEffect(() => {
    const initPlayer = async () => {
      if (!video.vimeoId || playerRef.current) return

      try {
        setIsLoading(true)
        const { default: Player } = await import('@vimeo/player')
        
        // Simple Vimeo config - let Vimeo handle controls
        const player = new Player(containerRef.current!, {
          id: Number(video.vimeoId),
          responsive: true,
          controls: true, // Use Vimeo's native controls
          playsinline: true,
          title: false,
          byline: false,
          portrait: false
        })
        
        playerRef.current = player

        // Basic event handlers
        player.on('loaded', () => {
          setIsLoading(false)
          // Auto-resume if there's a saved position
          if (resumePosition > 0) {
            player.setCurrentTime(resumePosition)
          }
        })

        // Save progress every 5 seconds while playing
        let saveInterval: NodeJS.Timeout
        player.on('play', () => {
          saveInterval = setInterval(async () => {
            try {
              const currentTime = await player.getCurrentTime()
              saveProgressRef.current(currentTime)
            } catch (_err) {
              // Player might be destroyed
            }
          }, 5000) // Save every 5 seconds
        })

        player.on('pause', async () => {
          clearInterval(saveInterval)
          try {
            const currentTime = await player.getCurrentTime()
            saveProgressRef.current(currentTime)
          } catch (_err) {
            // Player might be destroyed
          }
        })

        player.on('ended', async () => {
          clearInterval(saveInterval)
          try {
            const duration = await player.getDuration()
            saveProgressRef.current(duration)
          } catch (_err) {
            // Player might be destroyed
          }
        })

        player.on('error', (error: any) => {
          console.error('Video error:', error)
          setError('Video failed to load')
          setIsLoading(false)
        })

      } catch (err) {
        console.error('Failed to initialize player:', err)
        setError('Failed to load video player')
        setIsLoading(false)
      }
    }

    initPlayer()

    // Cleanup
    return () => {
      if (playerRef.current) {
        try {
          // Save final progress before cleanup
          playerRef.current.getCurrentTime().then((time: number) => {
            saveProgressRef.current(time)
          }).catch(() => {})
          
          playerRef.current.destroy()
        } catch (_err) {
          // Player already destroyed
        }
        playerRef.current = null
      }
    }
  }, [video.vimeoId, resumePosition])

  // Save progress on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (playerRef.current) {
        try {
          playerRef.current.getCurrentTime().then((time: number) => {
            saveProgressRef.current(time)
          }).catch(() => {})
        } catch (_err) {
          // Player not ready
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleBeforeUnload)
    }
  }, [])

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: video?.title,
        text: video?.description,
        url: window.location.href
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (seconds?: number) => {
    if (!seconds) return 'Unknown'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center text-white">
          <p className="text-lg mb-4">{error}</p>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-gray-800/60 hover:bg-gray-700/80 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="w-8 h-8 rounded-full bg-gray-800/60 hover:bg-gray-700/80 flex items-center justify-center transition-colors"
            >
              <Share className="w-4 h-4 text-white" />
            </button>
            
            <button
              onClick={() => setShowActions(!showActions)}
              className="w-8 h-8 rounded-full bg-gray-800/60 hover:bg-gray-700/80 flex items-center justify-center transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Video container */}
      <div className="relative">
        <div 
          ref={containerRef}
          className="w-full aspect-video bg-black"
        />
        
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p>Loading video...</p>
            </div>
          </div>
        )}
      </div>

      {/* Video Information */}
      <div className="px-4 pb-8">
        {/* Title */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-white leading-tight mb-3">
            {video.title}
          </h1>
          {resumePosition > 0 && (
            <p className="text-sm text-gray-400">
              Resuming from {Math.floor(resumePosition / 60)}:{String(Math.floor(resumePosition % 60)).padStart(2, '0')}
            </p>
          )}
        </div>

        {/* Metadata */}
        <div className="space-y-3">
          {/* Category & Date - Compact Layout */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {video.category && (
              <span className="px-2 py-1 bg-blue-600 rounded-full text-white text-xs font-medium">
                {video.category.name}
              </span>
            )}
            {video.subcategory && (
              <span className="px-2 py-1 bg-gray-700 rounded-full text-gray-300 text-xs">
                {video.subcategory.name}
              </span>
            )}
            <span className="text-gray-400 text-xs ml-1">
              {formatDate(video.createdAt)}
            </span>
            <span className="text-gray-400 text-xs">
              • {formatTime(video.vimeoDuration)}
            </span>
          </div>

          {/* Description - Expandable */}
          {video.description && (
            <div className="mt-4">
              <p className="text-gray-300 leading-relaxed text-sm">
                {video.description}
              </p>
            </div>
          )}

          {/* Tags - Compact */}
          {video.tags && video.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {video.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-800 rounded-full text-xs text-gray-400"
                >
                  #{tag}
                </span>
              ))}
              {video.tags.length > 3 && (
                <span className="px-2 py-1 text-xs text-gray-500">
                  +{video.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Menu Overlay */}
      {showActions && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={() => setShowActions(false)}>
          <div className="bg-gray-900 w-full rounded-t-3xl p-6 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4"></div>
            
            <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-800 transition-colors">
              <Bookmark className="w-5 h-5 text-white" />
              <span className="text-white font-medium">Save to Watch Later</span>
            </button>
            
            <button 
              onClick={handleShare}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-800 transition-colors"
            >
              <Share className="w-5 h-5 text-white" />
              <span className="text-white font-medium">Share Video</span>
            </button>
            
            <button 
              onClick={() => setShowActions(false)}
              className="w-full p-4 mt-6 text-gray-400 text-center font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}