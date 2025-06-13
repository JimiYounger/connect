'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward } from 'lucide-react'
import { useVideoProgress } from '../hooks/useVideoProgress'
import type { VideoForViewing } from '../types'

interface VideoPlayerProps {
  video: VideoForViewing
  autoplay?: boolean
  onComplete?: () => void
  onProgress?: (progress: number) => void
}

export function VideoPlayer({ 
  video, 
  autoplay = false, 
  onComplete,
  onProgress 
}: VideoPlayerProps) {
  // Player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(video.vimeoDuration || 0)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showResumePrompt, setShowResumePrompt] = useState(false)

  // Refs
  const playerRef = useRef<HTMLDivElement>(null)
  const vimeoPlayerRef = useRef<any>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const progressUpdateRef = useRef<NodeJS.Timeout | null>(null)

  // Progress tracking
  const {
    progress,
    updateProgress,
    recordEvent,
    getResumePosition,
    shouldShowResume,
    isCompleted
  } = useVideoProgress(video.id, duration)

  // Auto-hide controls on mobile
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000) // Hide after 3 seconds
    }
  }, [isPlaying])

  // Show controls temporarily
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true)
    resetControlsTimeout()
  }, [resetControlsTimeout])

  // Initialize Vimeo player
  useEffect(() => {
    if (!video.vimeoId || typeof window === 'undefined') return

    const initPlayer = async () => {
      try {
        // Dynamically import Vimeo player
        const { default: Player } = await import('@vimeo/player')
        
        if (!playerRef.current) return

        const player = new Player(playerRef.current, {
          id: Number(video.vimeoId),
          responsive: true,
          playsinline: true,
          title: false,
          byline: false,
          portrait: false,
          controls: false, // We'll use custom controls
          autopause: false,
          autoplay: autoplay,
          muted: isMuted
        })

        vimeoPlayerRef.current = player

        // Set up event listeners
        player.on('loaded', async () => {
          setIsLoading(false)
          const videoDuration = await player.getDuration()
          setDuration(videoDuration)
          
          // Check if we should show resume prompt
          if (shouldShowResume()) {
            setShowResumePrompt(true)
          } else if (autoplay) {
            handlePlay()
          }
        })

        player.on('play', () => {
          setIsPlaying(true)
          recordEvent('play', currentTime)
          resetControlsTimeout()
        })

        player.on('pause', () => {
          setIsPlaying(false)
          recordEvent('pause', currentTime)
          setShowControls(true)
        })

        player.on('timeupdate', async (data: { seconds: number }) => {
          setCurrentTime(data.seconds)
          onProgress?.(data.seconds)
          
          // Update progress every 10 seconds while playing
          if (isPlaying && progressUpdateRef.current) {
            clearTimeout(progressUpdateRef.current)
          }
          
          if (isPlaying) {
            progressUpdateRef.current = setTimeout(() => {
              updateProgress(data.seconds, [{
                type: 'progress',
                timestamp: Date.now(),
                position: data.seconds
              }])
            }, 1000)
          }
        })

        player.on('ended', () => {
          setIsPlaying(false)
          setShowControls(true)
          recordEvent('complete', duration)
          updateProgress(duration, [{
            type: 'complete',
            timestamp: Date.now(),
            position: duration
          }], true)
          onComplete?.()
        })

        player.on('error', (error: any) => {
          console.error('Vimeo player error:', error)
          setError('Failed to load video')
          setIsLoading(false)
        })

        player.on('volumechange', (data: { volume: number }) => {
          setIsMuted(data.volume === 0)
        })

      } catch (err) {
        console.error('Error initializing Vimeo player:', err)
        setError('Failed to initialize video player')
        setIsLoading(false)
      }
    }

    initPlayer()

    return () => {
      if (vimeoPlayerRef.current) {
        vimeoPlayerRef.current.destroy()
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      if (progressUpdateRef.current) {
        clearTimeout(progressUpdateRef.current)
      }
    }
  }, [video.vimeoId, autoplay, isMuted])

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
      recordEvent('seek', time, { from: currentTime })
      setCurrentTime(time)
    } catch (err) {
      console.error('Error seeking video:', err)
    }
  }, [currentTime, recordEvent])


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

  const handleResumeFromPosition = useCallback(() => {
    const resumePos = getResumePosition()
    handleSeek(resumePos)
    setShowResumePrompt(false)
    handlePlay()
  }, [getResumePosition, handleSeek, handlePlay])

  const handleStartFromBeginning = useCallback(() => {
    handleSeek(0)
    setShowResumePrompt(false)
    handlePlay()
  }, [handleSeek, handlePlay])

  const skipForward = useCallback(() => {
    const newTime = Math.min(currentTime + 10, duration)
    handleSeek(newTime)
  }, [currentTime, duration, handleSeek])

  const skipBackward = useCallback(() => {
    const newTime = Math.max(currentTime - 10, 0)
    handleSeek(newTime)
  }, [currentTime, handleSeek])

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
      {/* Resume Prompt Overlay */}
      {showResumePrompt && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center shadow-2xl">
            <h3 className="font-semibold text-lg mb-2">Resume Watching?</h3>
            <p className="text-gray-600 text-sm mb-4">
              You&apos;ve watched {Math.round(watchedPercentage)}% of this video
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleStartFromBeginning}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Start Over
              </button>
              <button
                onClick={handleResumeFromPosition}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Resume
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Container */}
      <div 
        ref={playerRef}
        className="relative aspect-video bg-black rounded-lg overflow-hidden touch-manipulation"
        onTouchStart={showControlsTemporarily}
        onClick={showControlsTemporarily}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}

        {/* Vimeo Player will be injected here */}
        
        {/* Custom Controls Overlay */}
        <div 
          className={`absolute inset-0 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Top Gradient */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent" />
          
          {/* Bottom Gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />

          {/* Center Play/Pause Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 active:scale-95 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white ml-0" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </button>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="relative h-1 bg-white/30 rounded-full">
                {/* Watched Progress (from previous sessions) */}
                <div 
                  className="absolute h-full bg-white/50 rounded-full transition-all duration-300"
                  style={{ width: `${watchedPercentage}%` }}
                />
                {/* Current Progress */}
                <div 
                  className="absolute h-full bg-white rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
                {/* Scrub Handle */}
                <div 
                  className="absolute w-4 h-4 bg-white rounded-full -mt-1.5 transition-all duration-300 shadow-lg"
                  style={{ left: `calc(${progressPercentage}% - 8px)` }}
                />
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              {/* Left Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={skipBackward}
                  className="w-10 h-10 flex items-center justify-center text-white active:scale-95 transition-transform"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                
                <button
                  onClick={isPlaying ? handlePause : handlePlay}
                  className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black active:scale-95 transition-transform shadow-lg"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-0.5" />
                  )}
                </button>

                <button
                  onClick={skipForward}
                  className="w-10 h-10 flex items-center justify-center text-white active:scale-95 transition-transform"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Center Time Display */}
              <div className="text-white text-sm font-medium">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleMute}
                  className="w-10 h-10 flex items-center justify-center text-white active:scale-95 transition-transform"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="w-10 h-10 flex items-center justify-center text-white active:scale-95 transition-transform"
                >
                  {isFullscreen ? (
                    <Minimize className="w-5 h-5" />
                  ) : (
                    <Maximize className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Video Title Overlay */}
          <div className="absolute top-4 left-4 right-4">
            <h3 className="text-white font-medium text-lg leading-tight line-clamp-2">
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
        </div>
      </div>

      {/* Mobile-optimized video info */}
      <div className="mt-4 px-1">
        <h2 className="font-semibold text-lg leading-tight mb-2">{video.title}</h2>
        {video.description && (
          <p className="text-gray-600 text-sm leading-relaxed">{video.description}</p>
        )}
        
        {/* Video metadata */}
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
          {video.category && (
            <span>{video.category.name}</span>
          )}
          {video.subcategory && (
            <span>• {video.subcategory.name}</span>
          )}
          <span>• {formatTime(duration)}</span>
        </div>

        {/* Completion indicator */}
        {isCompleted && (
          <div className="flex items-center gap-2 mt-3 text-green-600 text-sm">
            <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span>Completed</span>
          </div>
        )}
      </div>
    </div>
  )
}