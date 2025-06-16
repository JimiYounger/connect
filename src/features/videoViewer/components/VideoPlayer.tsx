'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, RotateCcw } from 'lucide-react'
import { useVideoProgress } from '../hooks/useVideoProgress'
import type { VideoForViewing } from '../types'

interface VideoPlayerProps {
  video: VideoForViewing
  autoplay?: boolean
  onComplete?: () => void
  onProgress?: (progress: number) => void
  hideVideoInfo?: boolean
  profile?: any
}

export function VideoPlayer({ 
  video, 
  autoplay = false, // Default to false for better mobile compatibility
  onComplete,
  onProgress,
  hideVideoInfo = false,
  profile
}: VideoPlayerProps) {
  // Basic player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(video.vimeoDuration || 0)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Single refs for player and container
  const playerRef = useRef<HTMLDivElement>(null)
  const vimeoPlayerRef = useRef<any>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Progress tracking
  const {
    progress,
    updateProgress,
    recordEvent,
    getResumePosition,
    isCompleted
  } = useVideoProgress(video.id, duration, profile)

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 4000)
    }
  }, [isPlaying])

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true)
    resetControlsTimeout()
  }, [resetControlsTimeout])

  // Create stable refs for event handlers to avoid dependency issues
  const currentTimeRef = useRef(currentTime)
  const updateProgressRef = useRef(updateProgress)
  const recordEventRef = useRef(recordEvent)
  const onProgressRef = useRef(onProgress)
  const onCompleteRef = useRef(onComplete)

  // Update refs when values change
  useEffect(() => {
    currentTimeRef.current = currentTime
    updateProgressRef.current = updateProgress
    recordEventRef.current = recordEvent
    onProgressRef.current = onProgress
    onCompleteRef.current = onComplete
  }, [currentTime, updateProgress, recordEvent, onProgress, onComplete])

  // Initialize Vimeo player - simplified
  useEffect(() => {
    if (!video.vimeoId || vimeoPlayerRef.current) return

    const initPlayer = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Import Vimeo player
        const { default: Player } = await import('@vimeo/player')
        
        if (!playerRef.current) {
          throw new Error('Player container not found')
        }

        // Simple Vimeo player configuration
        const player = new Player(playerRef.current, {
          id: Number(video.vimeoId),
          responsive: true,
          controls: false, // Use custom controls
          autoplay: autoplay,
          muted: isMuted,
          playsinline: true,
          title: false,
          byline: false,
          portrait: false
        })
        
        vimeoPlayerRef.current = player

        // Simple event handlers
        player.on('loaded', async () => {
          const videoDuration = await player.getDuration()
          setDuration(videoDuration)
          setIsLoading(false)
        })

        player.on('play', () => {
          setIsPlaying(true)
          setShowControls(true)
          // Auto-hide controls after 4 seconds
          setTimeout(() => setShowControls(false), 4000)
          
          // Record play event
          recordEventRef.current('play', currentTimeRef.current)
        })

        player.on('pause', () => {
          setIsPlaying(false)
          setShowControls(true)
          
          // Record pause event and update progress
          const currentPos = currentTimeRef.current
          recordEventRef.current('pause', currentPos)
          updateProgressRef.current(currentPos, [{
            type: 'pause',
            timestamp: Date.now(),
            position: currentPos
          }])
        })

        player.on('timeupdate', (data: { seconds: number }) => {
          setCurrentTime(data.seconds)
          onProgressRef.current?.(data.seconds)
          
          // Update progress every 10 seconds while playing
          if (Math.floor(data.seconds) % 10 === 0 && data.seconds > 0) {
            updateProgressRef.current(data.seconds, [{
              type: 'progress',
              timestamp: Date.now(),
              position: data.seconds
            }])
          }
        })

        player.on('ended', async () => {
          setIsPlaying(false)
          setShowControls(true)
          
          const finalTime = await player.getCurrentTime()
          recordEventRef.current('complete', finalTime)
          updateProgressRef.current(finalTime, [{
            type: 'complete',
            timestamp: Date.now(),
            position: finalTime
          }], true)
          onCompleteRef.current?.()
        })

        player.on('error', (error: any) => {
          console.error('Vimeo player error:', error)
          setError(`Failed to load video: ${error.message || 'Unknown error'}`)
          setIsLoading(false)
        })

        player.on('volumechange', (data: { volume: number }) => {
          setIsMuted(data.volume === 0)
        })

      } catch (err) {
        console.error('Error initializing video player:', err)
        setError('Failed to initialize video player')
        setIsLoading(false)
      }
    }

    initPlayer()

    // Cleanup
    return () => {
      // Save current progress before destroying player
      if (currentTimeRef.current > 0 && vimeoPlayerRef.current) {
        updateProgressRef.current(currentTimeRef.current, [{
          type: 'pause',
          timestamp: Date.now(),
          position: currentTimeRef.current,
          metadata: { reason: 'component_unmount' }
        }], true) // Force save
      }

      if (vimeoPlayerRef.current) {
        try {
          vimeoPlayerRef.current.destroy()
        } catch (err) {
          console.log('Error destroying player:', err)
        }
        vimeoPlayerRef.current = null
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [video.vimeoId, autoplay, isMuted])

  // Auto-resume when progress data is loaded and player is ready (only once)
  useEffect(() => {
    if (!progress || isLoading || !vimeoPlayerRef.current || !duration) return
    
    // Only auto-resume if we haven't started playing yet
    if (currentTime > 5) return // If user has already watched more than 5 seconds, don't auto-resume
    
    const resumePos = getResumePosition()
    if (resumePos > 0) {
      vimeoPlayerRef.current.setCurrentTime(resumePos)
        .then(() => setCurrentTime(resumePos))
        .catch(err => console.error('Error resuming video:', err))
    }
  }, [progress, isLoading, duration, currentTime, getResumePosition])

  // Track progress on navigation/page leave
  useEffect(() => {
    const saveProgressOnLeave = () => {
      if (currentTimeRef.current > 0 && vimeoPlayerRef.current) {
        // Force immediate progress save
        updateProgressRef.current(currentTimeRef.current, [{
          type: 'pause',
          timestamp: Date.now(),
          position: currentTimeRef.current,
          metadata: { reason: 'navigation_away' }
        }], true) // Force save
      }
    }

    const handleBeforeUnload = () => {
      saveProgressOnLeave()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveProgressOnLeave()
      }
    }

    // Add event listeners for page navigation and app backgrounding
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      // Save progress on component cleanup (when navigating away)
      saveProgressOnLeave()
      
      // Remove event listeners
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, []) // Empty dependency array since we use refs

  // Simple auto-hide controls
  useEffect(() => {
    if (!isPlaying || !showControls) return
    
    const timer = setTimeout(() => {
      setShowControls(false)
    }, 4000)
    
    return () => clearTimeout(timer)
  }, [isPlaying, showControls])

  // Player control functions
  const handlePlay = useCallback(async () => {
    if (!vimeoPlayerRef.current) return
    try {
      await vimeoPlayerRef.current.play()
    } catch (err) {
      console.error('Error playing video:', err)
    }
  }, [])

  const handlePause = useCallback(async () => {
    if (!vimeoPlayerRef.current) return
    try {
      await vimeoPlayerRef.current.pause()
    } catch (err) {
      console.error('Error pausing video:', err)
    }
  }, [])

  const handleSeek = useCallback(async (time: number) => {
    if (!vimeoPlayerRef.current) return
    try {
      await vimeoPlayerRef.current.setCurrentTime(time)
      setCurrentTime(time)
    } catch (err) {
      console.error('Error seeking video:', err)
    }
  }, [])

  const toggleMute = useCallback(async () => {
    if (!vimeoPlayerRef.current) return
    try {
      const newVolume = isMuted ? 1 : 0
      await vimeoPlayerRef.current.setVolume(newVolume)
      setIsMuted(!isMuted)
    } catch (err) {
      console.error('Error toggling mute:', err)
    }
  }, [isMuted])

  const toggleFullscreen = useCallback(async () => {
    if (!playerRef.current) return
    try {
      if (!isFullscreen) {
        if (playerRef.current.requestFullscreen) {
          await playerRef.current.requestFullscreen()
        }
        setIsFullscreen(true)
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        }
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err)
    }
  }, [isFullscreen])

  const skipForward = useCallback(() => {
    const newTime = Math.min(currentTime + 10, duration)
    handleSeek(newTime)
  }, [currentTime, duration, handleSeek])

  const skipBackward = useCallback(() => {
    const newTime = Math.max(currentTime - 10, 0)
    handleSeek(newTime)
  }, [currentTime, handleSeek])

  const handleStartOver = useCallback(async () => {
    handleSeek(0)
    handlePlay()
  }, [handleSeek, handlePlay])

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0
  const watchedPercentage = progress?.percentComplete || 0

  if (error) {
    return (
      <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center text-white px-4">
          <div className="text-red-400 mb-2">⚠️</div>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full">
      {/* Video Player Container */}
      <div 
        ref={playerRef}
        className="relative aspect-video bg-black rounded-lg overflow-hidden"
        onClick={showControlsTemporarily}
        onTouchStart={showControlsTemporarily}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}

        {/* Custom Controls Overlay */}
        <div 
          className={`absolute inset-0 z-10 transition-opacity duration-300 pointer-events-none ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Gradients */}
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />

          {/* Center Play/Pause Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 hover:bg-black/80 transition-colors pointer-events-auto"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </button>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="relative h-1 bg-white/30 rounded-full cursor-pointer">
                {/* Watched Progress */}
                <div 
                  className="absolute h-full bg-white/50 rounded-full"
                  style={{ width: `${watchedPercentage}%` }}
                />
                {/* Current Progress */}
                <div 
                  className="absolute h-full bg-white rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
                {/* Scrub Handle */}
                <div 
                  className="absolute w-3 h-3 bg-white rounded-full -mt-1 shadow-lg"
                  style={{ left: `calc(${progressPercentage}% - 6px)` }}
                />
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              {/* Left Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={skipBackward}
                  className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                
                <button
                  onClick={isPlaying ? handlePause : handlePlay}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black hover:bg-white/90 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </button>

                <button
                  onClick={skipForward}
                  className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                <button
                  onClick={handleStartOver}
                  className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
                  title="Start Over"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>

              {/* Center Time Display */}
              <div className="text-white text-sm font-medium">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
                >
                  <Maximize className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Video Title */}
          {!hideVideoInfo && (
            <div className="absolute top-4 left-4 right-4">
              <h3 className="text-white font-medium text-lg leading-tight">
                {video.title}
              </h3>
              {progress && progress.percentComplete > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-white/80 text-sm">
                    {Math.round(progress.percentComplete)}% watched
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Video Info Below Player */}
      {!hideVideoInfo && (
        <div className="mt-4">
          <h2 className="font-semibold text-lg mb-2">{video.title}</h2>
          {video.description && (
            <p className="text-gray-600 text-sm">{video.description}</p>
          )}
          
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            {video.category && <span>{video.category.name}</span>}
            {video.subcategory && <span>• {video.subcategory.name}</span>}
            <span>• {formatTime(duration)}</span>
          </div>

          {isCompleted && (
            <div className="flex items-center gap-2 mt-3 text-green-600 text-sm">
              <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span>Completed</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}