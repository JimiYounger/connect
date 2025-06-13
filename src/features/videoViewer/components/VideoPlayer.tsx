'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, Settings } from 'lucide-react'
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
  autoplay = false, 
  onComplete,
  onProgress,
  hideVideoInfo = false,
  profile
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
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [supportsPlaybackRate, setSupportsPlaybackRate] = useState(false) // Start false, will be set true only if it works

  // Refs
  const playerRef = useRef<HTMLDivElement>(null)
  const vimeoPlayerRef = useRef<any>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const progressUpdateRef = useRef<NodeJS.Timeout | null>(null)
  const hasShownResumeRef = useRef<boolean>(false)

  // Progress tracking
  const {
    progress,
    loading: progressLoading,
    updateProgress,
    recordEvent,
    getResumePosition,
    shouldShowResume,
    isCompleted
  } = useVideoProgress(video.id, duration, profile)

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

  // Close speed menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSpeedMenu && !((event.target as Element)?.closest('.speed-menu-container'))) {
        setShowSpeedMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSpeedMenu])

  // Player control functions - defined before useEffect that uses them
  const handlePlay = useCallback(async () => {
    if (!vimeoPlayerRef.current) return
    
    try {
      await vimeoPlayerRef.current.play()
    } catch (err) {
      console.error('Error playing video:', err)
    }
  }, [])

  // Initialize Vimeo player
  // Note: onComplete and onProgress are props that should be memoized by parent components
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
          muted: isMuted,
          transparent: false,
          background: false
        })

        vimeoPlayerRef.current = player

        // Set up event listeners
        player.on('loaded', async () => {
          setIsLoading(false)
          const videoDuration = await player.getDuration()
          setDuration(videoDuration)
          
          // Playback speed control disabled until proper configuration is added
          // Vimeo's getPlaybackRate() returns values even when speed control isn't available
          
          // Initial resume check will be handled by separate effect
          if (autoplay) {
            handlePlay()
          }
        })

        player.on('play', async () => {
          setIsPlaying(true)
          const currentPos = await player.getCurrentTime()
          recordEvent('play', currentPos)
          resetControlsTimeout()
        })

        player.on('pause', async () => {
          setIsPlaying(false)
          const currentPos = await player.getCurrentTime()
          recordEvent('pause', currentPos)
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

        player.on('ended', async () => {
          setIsPlaying(false)
          setShowControls(true)
          const currentPos = await player.getCurrentTime()
          recordEvent('complete', currentPos)
          updateProgress(currentPos, [{
            type: 'complete',
            timestamp: Date.now(),
            position: currentPos
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
  }, [video.vimeoId, autoplay, isMuted, handlePlay, isPlaying, onComplete, onProgress, recordEvent, resetControlsTimeout, updateProgress])

  // Handle iframe pointer events based on control visibility
  useEffect(() => {
    if (!playerRef.current) return
    
    const iframe = playerRef.current.querySelector('iframe')
    if (iframe) {
      iframe.style.pointerEvents = showControls ? 'none' : 'auto'
    }
  }, [showControls])

  // Check for resume prompt when progress data becomes available
  useEffect(() => {
    // Only check once progress has loaded and we haven't already shown the prompt for this session
    if (!progressLoading && progress && !hasShownResumeRef.current) {
      console.log('Progress loaded, checking resume:', { 
        shouldResume: shouldShowResume(), 
        progress: progress,
        percentComplete: progress.percentComplete 
      })
      
      if (shouldShowResume()) {
        setShowResumePrompt(true)
        hasShownResumeRef.current = true
      }
    }
  }, [progressLoading, progress, shouldShowResume])

  // Additional player control functions

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

  const changePlaybackSpeed = useCallback(async (speed: number) => {
    if (!vimeoPlayerRef.current) return
    
    try {
      await vimeoPlayerRef.current.setPlaybackRate(speed)
      setPlaybackRate(speed)
      setShowSpeedMenu(false)
    } catch (err: any) {
      console.log('Could not change playback speed:', err.message)
      
      // If speed control fails, hide the feature
      setSupportsPlaybackRate(false)
      setShowSpeedMenu(false)
    }
  }, [])

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
        className={`video-player relative aspect-video bg-black rounded-2xl overflow-hidden touch-manipulation ${showControls ? 'controls-visible' : ''}`}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}

        {/* Vimeo Player will be injected here */}
        
        {/* Invisible Click Overlay for Control Visibility */}
        <div 
          className="absolute inset-0 z-10 cursor-pointer"
          onTouchStart={showControlsTemporarily}
          onClick={showControlsTemporarily}
        />
        
        {/* Custom Controls Overlay */}
        <div 
          className={`absolute inset-0 z-20 transition-opacity duration-300 pointer-events-none ${
            showControls ? 'opacity-100' : 'opacity-0'
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
              className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 active:scale-95 transition-transform pointer-events-auto"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white ml-0" />
              ) : (
                <Play className="w-6 h-6 text-white ml-0.5" />
              )}
            </button>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
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
              <div className="flex items-center gap-3">
                <button
                  onClick={skipBackward}
                  className="w-8 h-8 flex items-center justify-center text-white active:scale-95 transition-transform"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                
                <button
                  onClick={isPlaying ? handlePause : handlePlay}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black active:scale-95 transition-transform shadow-lg"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </button>

                <button
                  onClick={skipForward}
                  className="w-8 h-8 flex items-center justify-center text-white active:scale-95 transition-transform"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Center Time Display */}
              <div className="text-white text-sm font-medium">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleMute}
                  className="w-8 h-8 flex items-center justify-center text-white active:scale-95 transition-transform"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                {/* Playback Speed Button - Only show if supported */}
                {supportsPlaybackRate && (
                  <div className="relative speed-menu-container">
                    <button
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      className="w-8 h-8 flex items-center justify-center text-white active:scale-95 transition-transform relative"
                    >
                      <Settings className="w-4 h-4" />
                      {playbackRate !== 1 && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
                          {playbackRate}x
                        </span>
                      )}
                    </button>
                    
                    {/* Speed Menu */}
                    {showSpeedMenu && (
                      <div className="absolute bottom-10 right-0 bg-black/90 backdrop-blur-sm rounded-lg p-2 min-w-[80px] border border-white/20 shadow-2xl">
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                          <button
                            key={speed}
                            onClick={() => changePlaybackSpeed(speed)}
                            className={`w-full px-3 py-2 text-sm rounded transition-colors text-left ${
                              playbackRate === speed 
                                ? 'bg-blue-600 text-white' 
                                : 'text-white hover:bg-white/20'
                            }`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={toggleFullscreen}
                  className="w-8 h-8 flex items-center justify-center text-white active:scale-95 transition-transform"
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4" />
                  ) : (
                    <Maximize className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Video Title Overlay */}
          {!hideVideoInfo && (
            <div className="absolute top-4 left-4 right-4 pointer-events-auto">
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
          )}
        </div>
      </div>

      {/* Mobile-optimized video info */}
      {!hideVideoInfo && (
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
      )}
    </div>
  )
}