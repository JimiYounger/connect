// src/features/videoViewer/services/permissionService.ts

import type { UserPermissions } from '@/features/permissions/types'
import type { VideoForViewing, VideoPermissionResult, VideoRoleAssignments } from '../types'

/**
 * Video Permission Service
 * 
 * Follows the same patterns as navigation permissions:
 * 1. Public videos are always accessible
 * 2. Only approved videos are visible (unless admin)
 * 3. Check role/team/area/region restrictions
 */
export class VideoPermissionService {
  
  /**
   * Check if a user can view a specific video
   */
  static checkVideoPermission(
    video: VideoForViewing,
    userPermissions: UserPermissions
  ): VideoPermissionResult {
    
    // Admin and Executive have access to all videos (even non-approved for admin purposes)
    if (userPermissions.roleType === 'Admin' || userPermissions.roleType === 'Executive') {
      return {
        canView: true,
        reason: 'role_access'
      }
    }

    // Non-approved videos are only visible to admins
    if (video.libraryStatus !== 'approved') {
      return {
        canView: false,
        restrictionReason: 'not_approved'
      }
    }

    // Public videos are accessible to all authenticated users
    if (video.publicSharingEnabled) {
      return {
        canView: true,
        reason: 'public'
      }
    }

    // If no visibility conditions are set, default to approved status
    if (!video.visibilityConditions) {
      return {
        canView: true,
        reason: 'approved'
      }
    }

    // Check role-based restrictions
    return this.checkRoleBasedAccess(video.visibilityConditions, userPermissions)
  }

  /**
   * Check role-based access using the same logic as navigation permissions
   */
  private static checkRoleBasedAccess(
    conditions: VideoRoleAssignments,
    userPermissions: UserPermissions
  ): VideoPermissionResult {
    
    // If specific role types are required
    if (conditions.roleTypes.length > 0) {
      if (!conditions.roleTypes.includes(userPermissions.roleType)) {
        return {
          canView: false,
          restrictionReason: 'no_role_match'
        }
      }
    }

    // Check team restrictions
    if (conditions.teams.length > 0) {
      if (!userPermissions.team || !conditions.teams.includes(userPermissions.team)) {
        return {
          canView: false,
          restrictionReason: 'no_team_match'
        }
      }
    }

    // Check area restrictions  
    if (conditions.areas.length > 0) {
      if (!userPermissions.area || !conditions.areas.includes(userPermissions.area)) {
        return {
          canView: false,
          restrictionReason: 'no_area_match'
        }
      }
    }

    // Check region restrictions
    if (conditions.regions.length > 0) {
      if (!userPermissions.region || !conditions.regions.includes(userPermissions.region)) {
        return {
          canView: false,
          restrictionReason: 'no_region_match'
        }
      }
    }

    // All restrictions passed
    return {
      canView: true,
      reason: this.getAccessReason(conditions, userPermissions)
    }
  }

  /**
   * Determine the specific reason for access grant
   */
  private static getAccessReason(
    conditions: VideoRoleAssignments,
    _userPermissions: UserPermissions
  ): VideoPermissionResult['reason'] {
    if (conditions.roleTypes.length > 0) return 'role_access'
    if (conditions.teams.length > 0) return 'team_access'
    if (conditions.areas.length > 0) return 'area_access'
    if (conditions.regions.length > 0) return 'region_access'
    return 'approved'
  }

  /**
   * Filter a list of videos to only include those the user can view
   */
  static filterViewableVideos(
    videos: VideoForViewing[],
    userPermissions: UserPermissions
  ): VideoForViewing[] {
    return videos.filter(video => 
      this.checkVideoPermission(video, userPermissions).canView
    )
  }

  /**
   * Get permission summary for debugging/admin purposes
   */
  static getPermissionSummary(
    video: VideoForViewing,
    userPermissions: UserPermissions
  ): {
    canView: boolean
    checks: {
      isApproved: boolean
      isPublic: boolean
      hasRoleAccess: boolean
      hasTeamAccess: boolean
      hasAreaAccess: boolean
      hasRegionAccess: boolean
    }
  } {
    const result = this.checkVideoPermission(video, userPermissions)
    
    return {
      canView: result.canView,
      checks: {
        isApproved: video.libraryStatus === 'approved',
        isPublic: video.publicSharingEnabled,
        hasRoleAccess: userPermissions.roleType === 'Admin' || 
                      userPermissions.roleType === 'Executive' ||
                      !video.visibilityConditions?.roleTypes.length ||
                      video.visibilityConditions?.roleTypes.includes(userPermissions.roleType),
        hasTeamAccess: !(video.visibilityConditions?.teams.length) ||
                      !!(userPermissions.team && video.visibilityConditions?.teams.includes(userPermissions.team)),
        hasAreaAccess: !(video.visibilityConditions?.areas.length) ||
                      !!(userPermissions.area && video.visibilityConditions?.areas.includes(userPermissions.area)),
        hasRegionAccess: !(video.visibilityConditions?.regions.length) ||
                        !!(userPermissions.region && video.visibilityConditions?.regions.includes(userPermissions.region))
      }
    }
  }
}