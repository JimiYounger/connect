// src/features/permissions/utils/checkPermissions.ts

import { ROLE_TYPE_PERMISSIONS, hasPermissionLevel } from '../constants/roles'
import type { RoleType, PermissionAction, UserPermissions } from '../types'

export function checkPermission(
  userPermissions: UserPermissions,
  action: PermissionAction,
  context?: {
    team?: string
    area?: string
    region?: string
  }
): boolean {
  // Debug log only in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Checking Permission:', {
      userPermissions,
      action,
      context,
      availableRoles: Object.keys(ROLE_TYPE_PERMISSIONS)
    })
  }

  // Normalize role type to match our constants
  const normalizedRoleType = userPermissions.roleType.charAt(0).toUpperCase() + 
    userPermissions.roleType.slice(1).toLowerCase() as RoleType

  const roleTypePermissions = ROLE_TYPE_PERMISSIONS[normalizedRoleType]

  if (!roleTypePermissions) {
    console.warn('Unknown role type:', userPermissions.roleType)
    return false
  }

  // First check if the role type has basic permission
  switch (action) {
    case 'manage_users':
      if (!roleTypePermissions.canManageUsers) return false
      break
    case 'view_reports':
      if (!roleTypePermissions.canViewReports) return false
      break
    case 'edit_settings':
      if (!roleTypePermissions.canEditSettings) return false
      break
    case 'view_dashboard':
      if (!roleTypePermissions.canAccessDashboard) return false
      break
  }

  // Then check area/region/team restrictions if applicable
  if (context) {
    if (roleTypePermissions.teamRestricted && 
        context.team && 
        context.team !== userPermissions.team) {
      return false
    }

    if (roleTypePermissions.areaRestricted && 
        context.area && 
        context.area !== userPermissions.area) {
      return false
    }

    if (roleTypePermissions.regionRestricted && 
        context.region && 
        context.region !== userPermissions.region) {
      return false
    }
  }

  return true
} 