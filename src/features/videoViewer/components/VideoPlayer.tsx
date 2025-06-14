'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, Settings, RotateCcw, Square, Triangle } from 'lucide-react'
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
  autoplay = true,
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
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [supportsPlaybackRate, setSupportsPlaybackRate] = useState(false) // Start false, will be set true only if it works
  const [initRetries, setInitRetries] = useState(0)
  const [iframeReady, setIframeReady] = useState(false)
  const isInitializingRef = useRef(false)
  const maxRetries = 3

  // Refs
  const playerRef = useRef<HTMLDivElement>(null)
  const vimeoPlayerRef = useRef<any>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const progressUpdateRef = useRef<NodeJS.Timeout | null>(null)
  const hasAutoResumedRef = useRef<boolean>(false)
  const hasUserInteractedRef = useRef<boolean>(false)

  // Progress tracking
  const {
    progress,
    loading: progressLoading,
    updateProgress,
    recordEvent,
    getResumePosition,
    isCompleted,
    resetProgress
  } = useVideoProgress(video.id, duration, profile)
  
  // Stable refs for functions to prevent re-initialization - MUST be after function declarations
  const updateProgressRef = useRef(updateProgress)
  const recordEventRef = useRef(recordEvent)
  const handlePlayRef = useRef(() => {})
  const resetControlsTimeoutRef = useRef(() => {})
  const currentTimeRef = useRef(currentTime)
  
  // Update refs when functions change
  useEffect(() => {
    updateProgressRef.current = updateProgress
    recordEventRef.current = recordEvent
    currentTimeRef.current = currentTime
  }, [updateProgress, recordEvent, currentTime])

  // Stable references for callbacks to prevent unnecessary re-renders
  const stableOnComplete = useCallback(() => {
    onComplete?.()
  }, [onComplete])

  const stableOnProgress = useCallback((time: number) => {
    onProgress?.(time)
  }, [onProgress])

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
      hasUserInteractedRef.current = true
      await vimeoPlayerRef.current.play()
    } catch (err) {
      console.error('Error playing video:', err)
    }
  }, [])

  // Update function refs after they're declared
  useEffect(() => {
    handlePlayRef.current = handlePlay
    resetControlsTimeoutRef.current = resetControlsTimeout
  }, [handlePlay, resetControlsTimeout])

  // Initialize Vimeo player
  // Note: onComplete and onProgress are props that should be memoized by parent components
  useEffect(() => {
    console.log('🚀 VideoPlayer useEffect triggered:', { vimeoId: video.vimeoId, hasWindow: typeof window !== 'undefined', isInitializing: isInitializingRef.current, hasExistingPlayer: !!vimeoPlayerRef.current })
    
    if (!video.vimeoId || typeof window === 'undefined') {
      console.log('❌ Early return - no vimeoId or no window')
      return
    }
    
    if (isInitializingRef.current || vimeoPlayerRef.current) {
      console.log('⚠️ Skipping initialization - already initializing or player exists')
      return
    }

    const initPlayer = async () => {
      try {
        isInitializingRef.current = true
        console.log('🎬 Starting Vimeo player initialization...')
        // Dynamically import Vimeo player
        const { default: Player } = await import('@vimeo/player')
        console.log('✅ Vimeo Player imported successfully:', Player)
        
        if (!playerRef.current) {
          console.error('❌ Player ref is null, cannot initialize')
          return
        }
        
        console.log('📦 Player ref found:', playerRef.current)
        console.log('🎯 Creating Vimeo Player with config:', {
          id: Number(video.vimeoId),
          responsive: true,
          playsinline: true,
          controls: false,
          autoplay: autoplay
        })

        const player = new Player(playerRef.current, {
          id: Number(video.vimeoId),
          responsive: true,
          playsinline: true,
          title: false,
          byline: false,
          portrait: false,
          controls: false, // We'll use custom controls
          autopause: false,
          autoplay: autoplay, // Use the autoplay prop
          muted: isMuted,
          transparent: false,
          background: false
        })
        
        console.log('🎪 Vimeo Player created:', player)

        vimeoPlayerRef.current = player

        // Set up event listeners
        player.on('loaded', async () => {
          console.log('🎬 Video loaded, checking iframe...')
          try {
            const videoDuration = await player.getDuration()
            setDuration(videoDuration)
            
            // Robust iframe detection with retries
            const waitForIframe = (attempts = 0) => {
              console.log(`🔍 Looking for iframe (attempt ${attempts + 1})...`)
              const iframe = playerRef.current?.querySelector('iframe')
              console.log('📋 Iframe search result:', iframe)
              
              if (iframe) {
                console.log('🎬 Iframe found! Details:', {
                  src: iframe.src,
                  width: iframe.width,
                  height: iframe.height,
                  style: iframe.style.cssText,
                  hidden: iframe.hidden,
                  display: getComputedStyle(iframe).display,
                  visibility: getComputedStyle(iframe).visibility
                })
                
                // Configure iframe styling
                iframe.style.width = '100%'
                iframe.style.height = '100%'
                iframe.style.position = 'absolute'
                iframe.style.top = '0'
                iframe.style.left = '0'
                iframe.style.border = 'none'
                iframe.style.borderRadius = 'inherit'
                iframe.style.visibility = 'visible'
                iframe.style.opacity = '1'
                iframe.style.display = 'block'
                iframe.style.zIndex = '1'
                iframe.style.backgroundColor = 'transparent'
                
                // Force hardware acceleration
                iframe.style.transform = 'translateZ(0)'
                iframe.style.webkitTransform = 'translateZ(0)'
                
                // Ensure iframe is not hidden by any CSS
                iframe.removeAttribute('hidden')
                iframe.setAttribute('data-vimeo-initialized', 'true')
                
                setIframeReady(true)
                setIsLoading(false)
                console.log('✅ Iframe ready! Final state:', {
                  src: iframe.src,
                  computedStyles: {
                    display: getComputedStyle(iframe).display,
                    visibility: getComputedStyle(iframe).visibility,
                    opacity: getComputedStyle(iframe).opacity,
                    zIndex: getComputedStyle(iframe).zIndex,
                    position: getComputedStyle(iframe).position
                  }
                })
              } else if (attempts < 10) {
                console.log(`🔄 Iframe not found, retrying... (${attempts + 1}/10)`)
                setTimeout(() => waitForIframe(attempts + 1), 200)
              } else {
                console.error('❌ Failed to find iframe after 10 attempts')
                setError('Failed to initialize video player')
                setIsLoading(false)
              }
            }
            
            // Start iframe detection
            waitForIframe()
            
          } catch (err) {
            console.error('Error during video initialization:', err)
            setError('Failed to initialize video')
            setIsLoading(false)
          }
        })

        player.on('play', async () => {
          console.log('▶️ Video started playing')
          const iframe = playerRef.current?.querySelector('iframe')
          if (iframe) {
            console.log('🎥 Video playing - iframe state:', {
              src: iframe.src,
              display: getComputedStyle(iframe).display,
              visibility: getComputedStyle(iframe).visibility,
              opacity: getComputedStyle(iframe).opacity
            })
          }
          setIsPlaying(true)
          const currentPos = await player.getCurrentTime()
          recordEventRef.current('play', currentPos)
          // Show controls initially then start auto-hide timer
          setShowControls(true)
          resetControlsTimeoutRef.current()
        })

        player.on('pause', async () => {
          setIsPlaying(false)
          const currentPos = await player.getCurrentTime()
          recordEventRef.current('pause', currentPos)
          setShowControls(true)
        })

        player.on('timeupdate', async (data: { seconds: number }) => {
          setCurrentTime(data.seconds)
          stableOnProgress(data.seconds)
          
          // Update progress every few seconds while playing
          if (progressUpdateRef.current) {
            clearTimeout(progressUpdateRef.current)
          }
          
          // Only update progress if playing
          progressUpdateRef.current = setTimeout(() => {
            updateProgressRef.current(data.seconds, [{
              type: 'progress',
              timestamp: Date.now(),
              position: data.seconds
            }])
          }, 1000)
        })

        player.on('ended', async () => {
          setIsPlaying(false)
          setShowControls(true)
          const currentPos = await player.getCurrentTime()
          recordEventRef.current('complete', currentPos)
          updateProgressRef.current(currentPos, [{
            type: 'complete',
            timestamp: Date.now(),
            position: currentPos
          }], true)
          stableOnComplete()
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
        console.error('Error initializing Vimeo player:', err)
        
        // Retry initialization if we haven't exceeded max retries
        if (initRetries < maxRetries) {
          console.log(`Retrying video initialization (attempt ${initRetries + 1}/${maxRetries})`)
          setInitRetries(prev => prev + 1)
          setIframeReady(false)
          setTimeout(() => {
            // Clear any existing player before retrying
            if (vimeoPlayerRef.current) {
              try {
                vimeoPlayerRef.current.destroy()
              } catch (destroyErr) {
                console.log('Error destroying previous player:', destroyErr)
              }
              vimeoPlayerRef.current = null
            }
            // Trigger re-initialization
            setError(null)
          }, 1500)
        } else {
          setError('Failed to initialize video player after multiple attempts')
          setIsLoading(false)
        }
      } finally {
        isInitializingRef.current = false
      }
    }

    initPlayer()

    return () => {
      // Save current progress before cleanup
      if (vimeoPlayerRef.current && currentTimeRef.current > 0) {
        updateProgressRef.current(currentTimeRef.current, [{
          type: 'pause',
          timestamp: Date.now(),
          position: currentTimeRef.current
        }], true) // Force save
      }

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
    // Fallback: Force iframe visibility after a timeout
    const fallbackTimeout = setTimeout(() => {
      if (!iframeReady && playerRef.current) {
        const iframe = playerRef.current.querySelector('iframe')
        if (iframe) {
          console.log('⚠️ Fallback: forcing iframe visibility')
          iframe.style.visibility = 'visible'
          iframe.style.opacity = '1'
          iframe.style.display = 'block'
          iframe.style.zIndex = '1'
          setIframeReady(true)
          setIsLoading(false)
        }
      }
    }, 3000) // 3 second fallback

    return () => {
      console.log('🧹 Cleaning up video player...')
      clearTimeout(fallbackTimeout)
      
      // Save current progress before cleanup
      if (vimeoPlayerRef.current && currentTimeRef.current > 0) {
        updateProgressRef.current(currentTimeRef.current, [{
          type: 'pause',
          timestamp: Date.now(),
          position: currentTimeRef.current
        }], true) // Force save
      }

      // Destroy existing player
      if (vimeoPlayerRef.current) {
        try {
          vimeoPlayerRef.current.destroy()
          console.log('🧹 Vimeo player destroyed')
        } catch (err) {
          console.log('Error destroying player:', err)
        }
        vimeoPlayerRef.current = null
      }
      
      // Clear all timeouts
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      if (progressUpdateRef.current) {
        clearTimeout(progressUpdateRef.current)
      }
      
      // Reset states
      setIsLoading(true)
      setIframeReady(false)
      isInitializingRef.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.vimeoId, isMuted, stableOnComplete, stableOnProgress, initRetries])

  // Save progress when page becomes hidden (user navigates away)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && vimeoPlayerRef.current && currentTime > 0) {
        // Force save current progress when page becomes hidden
        updateProgressRef.current(currentTime, [{
          type: 'pause',
          timestamp: Date.now(),
          position: currentTime,
          metadata: { reason: 'visibility_hidden' }
        }], true)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [currentTime, updateProgress])

  // Ensure iframe stays visible and properly configured
  useEffect(() => {
    if (!playerRef.current || !iframeReady) return
    
    const iframe = playerRef.current.querySelector('iframe')
    if (iframe) {
      console.log('🎬 Final iframe visibility check')
      
      // Final visibility configuration
      iframe.style.visibility = 'visible'
      iframe.style.opacity = '1'
      iframe.style.display = 'block'
      iframe.style.pointerEvents = 'auto'
      iframe.style.zIndex = '1'
      
      // Ensure no CSS is hiding it
      iframe.removeAttribute('hidden')
      iframe.style.transform = 'translateZ(0)'
      
      // Force a repaint
      iframe.offsetHeight
    }
  }, [iframeReady, isPlaying]) // Re-run when iframe becomes ready or play state changes

  // Auto-hide controls when video is playing
  useEffect(() => {
    if (isPlaying && showControls) {
      // Start the auto-hide timer whenever the video is playing and controls are visible
      const timer = setTimeout(() => {
        setShowControls(false)
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [isPlaying, showControls])

  // Handle fullscreen changes (including ESC key or browser controls)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(document.fullscreenElement || 
                                       (document as any).webkitFullscreenElement || 
                                       (document as any).mozFullScreenElement || 
                                       (document as any).msFullscreenElement)
      
      console.log('📺 Fullscreen change detected:', { isCurrentlyFullscreen, wasFullscreen: isFullscreen })
      
      if (isFullscreen && !isCurrentlyFullscreen) {
        // User exited fullscreen
        console.log('📺 Exited fullscreen, showing controls')
        setIsFullscreen(false)
        setShowControls(true)
        // Start auto-hide timer if video is playing
        if (isPlaying) {
          setTimeout(() => {
            setShowControls(false)
          }, 5000) // Give more time after fullscreen exit
        }
      } else if (!isFullscreen && isCurrentlyFullscreen) {
        // Entered fullscreen
        setIsFullscreen(true)
        setShowControls(true)
      }
    }

    // Add all the different fullscreen event listeners for cross-browser support
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [isFullscreen, isPlaying])

  // Auto-resume when progress data becomes available and player is loaded
  useEffect(() => {
    // Only auto-resume once when progress has loaded, player is ready, iframe is ready, not loading, and user hasn't interacted yet
    if (!progressLoading && !isLoading && iframeReady && !hasAutoResumedRef.current && !hasUserInteractedRef.current && vimeoPlayerRef.current && duration > 0) {
      const resumePos = getResumePosition()
      
      console.log('🔄 Auto-resuming video:', { 
        resumePos, 
        progress: progress,
        percentComplete: progress?.percentComplete,
        hasUserInteracted: hasUserInteractedRef.current,
        duration,
        isLoading
      })
      
      hasAutoResumedRef.current = true
      
      // Use the player directly to avoid dependency issues
      const autoResumeAndPlay = async () => {
        try {
          console.log('🔄 Starting auto-resume and play sequence...')
          // Wait for iframe to be properly rendered
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Double check that iframe is visible
          const iframe = playerRef.current?.querySelector('iframe')
          if (iframe) {
            console.log('🎬 Auto-resume: Iframe found, ensuring visibility', {
              currentSrc: iframe.src,
              currentDisplay: getComputedStyle(iframe).display,
              currentVisibility: getComputedStyle(iframe).visibility
            })
            iframe.style.visibility = 'visible'
            iframe.style.opacity = '1'
            iframe.style.display = 'block'
          } else {
            console.error('❌ Auto-resume: No iframe found!')
          }
          
          // If there's a resume position, seek to it first
          if (resumePos > 0) {
            console.log(`🔄 Seeking to resume position: ${resumePos}s`)
            await vimeoPlayerRef.current.setCurrentTime(resumePos)
            recordEvent('seek', resumePos, { from: 0, auto_resume: true })
            setCurrentTime(resumePos)
          }
          
          // Then play if autoplay is enabled
          if (autoplay) {
            console.log('▶️ Auto-playing video')
            hasUserInteractedRef.current = true
            await vimeoPlayerRef.current.play()
            // Start auto-hide timer after autoplay starts
            setTimeout(() => {
              if (isPlaying) {
                resetControlsTimeoutRef.current()
              }
            }, 1000)
          }
        } catch (err) {
          console.error('Error auto-resuming video:', err)
          // If autoplay fails, still try to seek to resume position
          if (resumePos > 0) {
            try {
              await vimeoPlayerRef.current.setCurrentTime(resumePos)
            } catch (seekErr) {
              console.error('Error seeking to resume position:', seekErr)
            }
          }
        }
      }
      
      autoResumeAndPlay()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressLoading, isLoading, iframeReady, progress, getResumePosition, recordEvent, autoplay, duration])

  // Additional player control functions

  const handlePause = useCallback(async () => {
    if (!vimeoPlayerRef.current) return
    
    try {
      hasUserInteractedRef.current = true
      await vimeoPlayerRef.current.pause()
    } catch (err) {
      console.error('Error pausing video:', err)
    }
  }, [])

  const handleSeek = useCallback(async (time: number) => {
    if (!vimeoPlayerRef.current) return
    
    try {
      hasUserInteractedRef.current = true
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
        // Show controls when exiting fullscreen
        setShowControls(true)
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



  const handleStartOver = useCallback(async () => {
    hasUserInteractedRef.current = true
    
    // Reset the progress in the database and local state
    await resetProgress()
    
    // Seek to beginning and play
    handleSeek(0)
    handlePlay()
  }, [resetProgress, handleSeek, handlePlay])

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
      {/* Video Player Container */}
      <div 
        ref={playerRef}
        className={`video-player relative aspect-video bg-black rounded-2xl overflow-hidden touch-manipulation ${showControls ? 'controls-visible' : ''}`}
        style={{ 
          minHeight: '200px', // Ensure minimum height for proper iframe rendering
          position: 'relative',
          width: '100%'
        }}
      >
        {/* Loading State */}
        {(isLoading || !iframeReady) && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            {initRetries > 0 && (
              <div className="absolute bottom-4 text-white text-sm opacity-70">
                Initializing video... (attempt {initRetries + 1})
              </div>
            )}
          </div>
        )}

        {/* Vimeo Player will be injected here */}
        
        {/* Click Overlay for Control Visibility */}
        <div 
          className="absolute inset-0 z-5 cursor-pointer"
          onTouchStart={showControlsTemporarily}
          onClick={showControlsTemporarily}
          style={{ pointerEvents: 'auto' }}
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
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black active:scale-95 transition-transform shadow-lg"
                >
                  {isPlaying ? (
                    <Square className="w-3 h-3" fill="currentColor" />
                  ) : (
                    <Triangle className="w-3 h-3 ml-0.5" fill="currentColor" style={{ transform: 'rotate(90deg)' }} />
                  )}
                </button>

                <button
                  onClick={skipForward}
                  className="w-8 h-8 flex items-center justify-center text-white active:scale-95 transition-transform"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                {/* Start Over Button */}
                <button
                  onClick={handleStartOver}
                  className="w-8 h-8 flex items-center justify-center text-white active:scale-95 transition-transform"
                  title="Start Over"
                >
                  <RotateCcw className="w-4 h-4" />
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