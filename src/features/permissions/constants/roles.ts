// src/features/permissions/constants/roles.ts
export const ROLE_TYPES = [
  'Setter',
  'Closer',
  'Manager',
  'Admin',
  'Executive'
] as const

export type RoleType = typeof ROLE_TYPES[number]

type RoleTypePermissions = {
  canManageUsers: boolean
  canViewReports: boolean
  canEditSettings: boolean
  canAccessDashboard: boolean
  teamRestricted: boolean
  areaRestricted: boolean
  regionRestricted: boolean
}

export const ROLE_TYPE_PERMISSIONS: Record<RoleType, RoleTypePermissions> = {
  Setter: {
    canManageUsers: false,
    canViewReports: false,
    canEditSettings: false,
    canAccessDashboard: true,
    teamRestricted: true,
    areaRestricted: true,
    regionRestricted: true
  },
  Closer: {
    canManageUsers: false,
    canViewReports: true,
    canEditSettings: false,
    canAccessDashboard: true,
    teamRestricted: true,
    areaRestricted: true,
    regionRestricted: true
  },
  Manager: {
    canManageUsers: true,
    canViewReports: true,
    canEditSettings: true,
    canAccessDashboard: true,
    teamRestricted: false,
    areaRestricted: true,
    regionRestricted: true
  },
  Admin: {
    canManageUsers: true,
    canViewReports: true,
    canEditSettings: true,
    canAccessDashboard: true,
    teamRestricted: false,
    areaRestricted: false,
    regionRestricted: false
  },
  Executive: {
    canManageUsers: true,
    canViewReports: true,
    canEditSettings: true,
    canAccessDashboard: true,
    teamRestricted: false,
    areaRestricted: false,
    regionRestricted: false
  }
} as const

export function hasPermissionLevel(requiredRole: RoleType, userRole: RoleType): boolean {
  const roleOrder = ['Setter', 'Closer', 'Manager', 'Admin', 'Executive']
  const requiredLevel = roleOrder.indexOf(requiredRole)
  const userLevel = roleOrder.indexOf(userRole)
  return userLevel >= requiredLevel
}