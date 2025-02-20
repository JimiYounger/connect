// src/features/permissions/types/index.ts

export type RoleType = 'Setter' | 'Closer' | 'Manager' | 'Executive' | 'Admin'

// More specific roles within each type
export type Role = string

export interface UserPermissions {
  roleType: RoleType
  role: Role
  team?: string
  area?: string
  region?: string
}

// Define what each role type can access
export interface PermissionScope {
  canAccessDashboard: boolean
  canManageUsers: boolean
  canViewReports: boolean
  canEditSettings: boolean
  areaRestricted: boolean
  regionRestricted: boolean
  teamRestricted: boolean
}

// For type-safe permission checks
export type PermissionAction = 
  | 'view_dashboard'
  | 'manage_users'
  | 'view_reports'
  | 'edit_settings'
  | 'view_team'
  | 'view_area'
  | 'view_region'
  | 'view_system_info' 