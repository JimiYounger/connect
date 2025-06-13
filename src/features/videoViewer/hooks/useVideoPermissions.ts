// src/features/videoViewer/hooks/useVideoPermissions.ts

'use client'

import { useMemo } from 'react'
import { usePermissions } from '@/features/permissions/hooks/usePermissions'
import { VideoPermissionService } from '../services/permissionService'
import type { VideoForViewing, VideoPermissionResult } from '../types'
import type { UserProfile } from '@/features/users/types'

/**
 * Hook for checking video permissions
 * Integrates with the existing permissions system
 */
export function useVideoPermissions(profile: UserProfile | null) {
  const { userPermissions } = usePermissions(profile)

  /**
   * Check if user can view a specific video
   */
  const canViewVideo = useMemo(() => {
    return (video: VideoForViewing): VideoPermissionResult => {
      if (!userPermissions) {
        return {
          canView: false,
          restrictionReason: 'no_role_match'
        }
      }

      return VideoPermissionService.checkVideoPermission(video, userPermissions)
    }
  }, [userPermissions])

  /**
   * Filter a list of videos to only viewable ones
   */
  const filterViewableVideos = useMemo(() => {
    return (videos: VideoForViewing[]): VideoForViewing[] => {
      if (!userPermissions) return []
      
      return VideoPermissionService.filterViewableVideos(videos, userPermissions)
    }
  }, [userPermissions])

  /**
   * Get detailed permission summary for debugging
   */
  const getPermissionSummary = useMemo(() => {
    return (video: VideoForViewing) => {
      if (!userPermissions) return null
      
      return VideoPermissionService.getPermissionSummary(video, userPermissions)
    }
  }, [userPermissions])

  /**
   * Check if user has any video viewing permissions
   */
  const canViewVideos = useMemo(() => {
    // All authenticated users can potentially view videos
    // Specific access depends on individual video permissions
    return !!userPermissions
  }, [userPermissions])

  /**
   * Check if user is admin (for admin features in video viewer)
   */
  const isAdmin = useMemo(() => {
    return userPermissions?.roleType === 'Admin'
  }, [userPermissions])

  /**
   * Check if user can see analytics
   */
  const canViewAnalytics = useMemo(() => {
    return userPermissions?.roleType === 'Admin' || 
           userPermissions?.roleType === 'Executive' ||
           userPermissions?.roleType === 'Manager'
  }, [userPermissions])

  return {
    canViewVideo,
    filterViewableVideos,
    getPermissionSummary,
    canViewVideos,
    isAdmin,
    canViewAnalytics,
    userPermissions,
    isLoading: !profile // Loading if we don't have profile yet
  }
}