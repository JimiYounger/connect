'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'

interface SimpleVideoPlayerProps {
  video: {
    id: string
    title: string
    vimeoId: string
    vimeoDuration?: number
  }
  onBack?: () => void
  profile?: any
}

export function SimpleVideoPlayer({ video, onBack, profile }: SimpleVideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resumePosition, setResumePosition] = useState(0)
  
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
            } catch (err) {
              // Player might be destroyed
            }
          }, 5000) // Save every 5 seconds
        })

        player.on('pause', async () => {
          clearInterval(saveInterval)
          try {
            const currentTime = await player.getCurrentTime()
            saveProgressRef.current(currentTime)
          } catch (err) {
            // Player might be destroyed
          }
        })

        player.on('ended', async () => {
          clearInterval(saveInterval)
          try {
            const duration = await player.getDuration()
            saveProgressRef.current(duration)
          } catch (err) {
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
        } catch (err) {
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
        } catch (err) {
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
      {/* Simple header with back button */}
      {onBack && (
        <div className="sticky top-0 z-50 p-4">
          <button
            onClick={onBack}
            className="flex items-center text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
        </div>
      )}

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

      {/* Video info */}
      <div className="p-4 text-white">
        <h1 className="text-xl font-bold mb-2">{video.title}</h1>
        {resumePosition > 0 && (
          <p className="text-sm text-gray-400">
            Resuming from {Math.floor(resumePosition / 60)}:{String(Math.floor(resumePosition % 60)).padStart(2, '0')}
          </p>
        )}
      </div>
    </div>
  )
}