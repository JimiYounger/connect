// src/features/videoViewer/types/index.ts

import type { RoleType } from '@/features/permissions/types'

/**
 * Video permission assignment structure
 * Matches the navigation and document patterns
 */
export interface VideoRoleAssignments {
  roleTypes: RoleType[]
  teams: string[]
  areas: string[]
  regions: string[]
}

/**
 * Video with viewing permissions and metadata
 */
export interface VideoForViewing {
  id: string
  title: string
  description?: string
  vimeoId?: string
  vimeoDuration?: number
  vimeoThumbnailUrl?: string
  customThumbnailUrl?: string
  thumbnailSource?: 'vimeo' | 'upload' | 'url'
  category?: {
    id: string
    name: string
  }
  subcategory?: {
    id: string
    name: string
  }
  series?: {
    id: string
    name: string
  }
  tags?: string[]
  libraryStatus: 'approved' | 'pending' | 'rejected' | 'archived'
  publicSharingEnabled: boolean
  visibilityConditions?: VideoRoleAssignments
  createdAt: string
  updatedAt: string
}

/**
 * User's watch progress for a video
 */
export interface VideoWatchProgress {
  id?: string
  videoFileId: string
  userId: string
  watchedSeconds: number
  totalDuration: number
  percentComplete: number
  lastPosition: number
  completed: boolean
  completedAt?: string
  events?: VideoWatchEvent[]
  deviceType?: string
  userAgent?: string
  createdAt: string
  updatedAt: string
}

/**
 * Analytics event for tracking video interactions
 */
export interface VideoWatchEvent {
  type: 'play' | 'pause' | 'seek' | 'complete' | 'progress'
  timestamp: number
  position: number
  metadata?: Record<string, any>
}

/**
 * Result of a video permission check
 */
export interface VideoPermissionResult {
  canView: boolean
  reason?: 'approved' | 'public' | 'role_access' | 'team_access' | 'area_access' | 'region_access'
  restrictionReason?: 'not_approved' | 'no_role_match' | 'no_team_match' | 'no_area_match' | 'no_region_match'
}

/**
 * Parameters for updating watch progress
 */
export interface UpdateWatchProgressParams {
  videoFileId: string
  userId: string
  currentPosition: number
  totalDuration: number
  events?: VideoWatchEvent[]
  deviceType?: string
  userAgent?: string
}