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
  | 'view_navigation'
  | 'manage_navigation'
  | 'view_role_navigation'
  | 'view_team_navigation'
  | 'view_area_navigation'
  | 'view_region_navigation'

// Permission context type
export interface PermissionContext {
  team?: string
  area?: string
  region?: string
  role?: RoleType
}

// Navigation filter types
export interface NavigationFilters {
  roles: RoleType[]
  teams: string[]
  areas: string[]
  regions: string[]
} 