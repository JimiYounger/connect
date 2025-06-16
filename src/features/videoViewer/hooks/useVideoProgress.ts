// src/features/videoViewer/hooks/useVideoProgress.ts

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/features/auth/context/auth-context'
import { WatchTrackingService } from '../services/watchTrackingService'
import type { VideoWatchProgress, VideoWatchEvent } from '../types'

/**
 * Hook for managing video watch progress and analytics
 */
export function useVideoProgress(videoFileId: string, totalDuration?: number, profileParam?: any) {
  const { session: _session, profile: authProfile } = useAuth()
  // Use passed profile if available, otherwise fall back to auth context
  const profile = profileParam || authProfile
  const [progress, setProgress] = useState<VideoWatchProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Track pending events for batch saving
  const pendingEventsRef = useRef<VideoWatchEvent[]>([])
  
  // Mobile optimization: reduce state updates
  const lastProgressRef = useRef<VideoWatchProgress | null>(null)

  // Use profile ID for video_watches table (not auth user ID)
  const userId = profile?.id

  /**
   * Load initial progress data
   */
  useEffect(() => {
    if (!userId || !videoFileId) return

    const loadProgress = async () => {
      try {
        setLoading(true)
        const progressData = await WatchTrackingService.getWatchProgress(videoFileId, userId)
        setProgress(progressData)
        lastProgressRef.current = progressData
        setError(null)
      } catch (err) {
        console.error('Error loading video progress:', err)
        setError('Failed to load progress')
      } finally {
        setLoading(false)
      }
    }

    loadProgress()
  }, [videoFileId, userId])

  /**
   * Update progress - simplified to only save on essential events
   */
  const updateProgress = useCallback(async (
    currentPosition: number,
    events: VideoWatchEvent[] = []
  ) => {
    if (!userId || !videoFileId || !totalDuration) return
    
    // Add events to pending queue
    pendingEventsRef.current.push(...events)

    try {
      const updatedProgress = await WatchTrackingService.updateWatchProgress({
        videoFileId,
        userId,
        currentPosition,
        totalDuration,
        events: pendingEventsRef.current,
        deviceType: getDeviceType(),
        userAgent: navigator.userAgent
      })

      if (updatedProgress) {
        // Mobile optimization: only update state if progress actually changed
        const hasChanged = !lastProgressRef.current || 
          lastProgressRef.current.lastPosition !== updatedProgress.lastPosition ||
          lastProgressRef.current.percentComplete !== updatedProgress.percentComplete ||
          lastProgressRef.current.completed !== updatedProgress.completed
        
        if (hasChanged) {
          setProgress(updatedProgress)
          lastProgressRef.current = updatedProgress
        }
        pendingEventsRef.current = [] // Clear pending events
      }
    } catch (err) {
      console.error('Error updating progress:', err)
      setError('Failed to save progress')
    }
  }, [userId, videoFileId, totalDuration])

  /**
   * Record a specific watch event
   */
  const recordEvent = useCallback((
    type: VideoWatchEvent['type'],
    position: number,
    metadata?: Record<string, any>
  ) => {
    const event: VideoWatchEvent = {
      type,
      timestamp: Date.now(),
      position,
      metadata
    }

    updateProgress(position, [event])
  }, [updateProgress])

  /**
   * Mark video as completed
   */
  const markCompleted = useCallback(async () => {
    if (!userId || !videoFileId) return

    try {
      const updatedProgress = await WatchTrackingService.markAsCompleted(videoFileId, userId)
      if (updatedProgress) {
        setProgress(updatedProgress)
      }
    } catch (err) {
      console.error('Error marking as completed:', err)
      setError('Failed to mark as completed')
    }
  }, [userId, videoFileId])


  /**
   * Get resume position (where to start playing)
   * Always returns a valid position - user requirement is to always resume where left off
   */
  const getResumePosition = useCallback((): number => {
    if (!progress) return 0
    
    // If already completed, start from beginning
    if (progress.completed) return 0
    
    // For very little progress (less than 5 seconds), start from beginning
    const resumePosition = progress.lastPosition > 0 ? progress.lastPosition : progress.watchedSeconds
    if (resumePosition < 5) return 0
    
    // If more than 95% watched, start from beginning 
    if (progress.percentComplete > 95) return 0
    
    return resumePosition
  }, [progress])


  /**
   * Save progress on navigation/unmount
   */
  const saveProgress = useCallback((currentPosition: number) => {
    if (userId && videoFileId && totalDuration && currentPosition > 0) {
      updateProgress(currentPosition, [{
        type: 'pause',
        timestamp: Date.now(),
        position: currentPosition,
        metadata: { reason: 'navigation_away' }
      }])
    }
  }, [userId, videoFileId, totalDuration, updateProgress])

  // Expose saveProgress for VideoPlayer to use on navigation
  const exposeSaveProgress = useCallback((currentPosition: number) => {
    saveProgress(currentPosition)
  }, [saveProgress])

  return {
    progress,
    loading,
    error,
    updateProgress,
    recordEvent,
    markCompleted,
    getResumePosition,
    saveProgress: exposeSaveProgress,
    // Computed properties
    isCompleted: progress?.completed || false,
    percentComplete: progress?.percentComplete || 0,
    lastPosition: progress?.lastPosition || 0,
    watchedSeconds: progress?.watchedSeconds || 0
  }
}

/**
 * Get device type for analytics
 */
function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown'
  
  const userAgent = navigator.userAgent.toLowerCase()
  
  if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
    return 'mobile'
  }
  
  if (/tablet|ipad/i.test(userAgent)) {
    return 'tablet'
  }
  
  return 'desktop'
}