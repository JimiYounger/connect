// src/features/videoViewer/hooks/useVideoProgress.ts

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/features/auth/context/auth-context'
import { WatchTrackingService } from '../services/watchTrackingService'
import type { VideoWatchProgress, VideoWatchEvent } from '../types'

/**
 * Hook for managing video watch progress and analytics
 */
export function useVideoProgress(videoFileId: string, totalDuration?: number) {
  const { session } = useAuth()
  const [progress, setProgress] = useState<VideoWatchProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Track when we last saved progress to avoid too frequent updates
  const lastSaveRef = useRef<number>(0)
  const pendingEventsRef = useRef<VideoWatchEvent[]>([])
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const userId = session?.user?.id

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
   * Update progress with debouncing to avoid excessive saves
   */
  const updateProgress = useCallback(async (
    currentPosition: number,
    events: VideoWatchEvent[] = [],
    force = false
  ) => {
    if (!userId || !videoFileId || !totalDuration) return

    // Add events to pending queue
    pendingEventsRef.current.push(...events)

    // Only save if enough time has passed or force save
    const now = Date.now()
    const timeSinceLastSave = now - lastSaveRef.current
    
    if (!force && timeSinceLastSave < 5000) { // Save at most every 5 seconds
      // Clear existing timeout and set new one
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        updateProgress(currentPosition, [], true)
      }, 5000 - timeSinceLastSave)
      
      return
    }

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
        setProgress(updatedProgress)
        lastSaveRef.current = now
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
   * Reset progress
   */
  const resetProgress = useCallback(async () => {
    if (!userId || !videoFileId) return

    try {
      const success = await WatchTrackingService.resetProgress(videoFileId, userId)
      if (success) {
        setProgress(null)
      }
    } catch (err) {
      console.error('Error resetting progress:', err)
      setError('Failed to reset progress')
    }
  }, [userId, videoFileId])

  /**
   * Get resume position (where to start playing)
   */
  const getResumePosition = useCallback((): number => {
    if (!progress) return 0
    
    // If already completed, start from beginning
    if (progress.completed) return 0
    
    // If less than 5% watched, start from beginning
    if (progress.percentComplete < 5) return 0
    
    // If more than 90% watched, start from beginning
    if (progress.percentComplete > 90) return 0
    
    return progress.lastPosition
  }, [progress])

  /**
   * Check if video should show resume prompt
   */
  const shouldShowResume = useCallback((): boolean => {
    if (!progress) return false
    return progress.percentComplete > 5 && progress.percentComplete < 90
  }, [progress])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    progress,
    loading,
    error,
    updateProgress,
    recordEvent,
    markCompleted,
    resetProgress,
    getResumePosition,
    shouldShowResume,
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