'use client'

import { useMemo } from 'react'
import { useAuth } from '@/features/auth/context/auth-context'
import { useProfile } from '@/features/users/hooks/useProfile'
import { usePermissions } from '@/features/permissions/hooks/usePermissions'
import type { 
  RoleType, 
  NavigationFilters
} from '@/features/permissions/types'

interface UseNavigationFiltersResult {
  filters: NavigationFilters
  isLoading: boolean
  error: Error | null
  canViewRole: (role: RoleType) => Promise<boolean>
  canViewTeam: (team: string) => Promise<boolean>
  canViewArea: (area: string) => Promise<boolean>
  canViewRegion: (region: string) => Promise<boolean>
}

export function useNavigationFilters(): UseNavigationFiltersResult {
  const { session } = useAuth()
  const { profile } = useProfile(session)
  const { userPermissions, can, isLoading, error } = usePermissions(profile)

  const filters = useMemo<NavigationFilters>(() => {
    const defaultFilters: NavigationFilters = {
      roles: [],
      teams: [],
      areas: [],
      regions: []
    }

    if (!userPermissions) return defaultFilters

    // Get available roles based on user's permission level
    const roles: RoleType[] = ['Setter', 'Closer', 'Manager', 'Executive', 'Admin']

    // Get filtered lists based on user's permissions
    const teams = userPermissions.team ? [userPermissions.team] : []
    const areas = userPermissions.area ? [userPermissions.area] : []
    const regions = userPermissions.region ? [userPermissions.region] : []

    return {
      roles,
      teams,
      areas,
      regions
    }
  }, [userPermissions])

  // Permission check methods
  const canViewRole = async (role: RoleType): Promise<boolean> => {
    // Check if user's role type is sufficient to view the target role
    if (!userPermissions) return false
    const roleHierarchy: Record<RoleType, number> = {
      'Admin': 5,
      'Executive': 4,
      'Manager': 3,
      'Closer': 2,
      'Setter': 1
    }
    const userRoleLevel = roleHierarchy[userPermissions.roleType] || 0
    const targetRoleLevel = roleHierarchy[role] || 0
    
    // Users can only view roles at their level or below
    return userRoleLevel >= targetRoleLevel && await can('view_role_navigation')
  }

  const canViewTeam = async (team: string): Promise<boolean> => {
    return can('view_team_navigation', { team })
  }

  const canViewArea = async (area: string): Promise<boolean> => {
    return can('view_area_navigation', { area })
  }

  const canViewRegion = async (region: string): Promise<boolean> => {
    return can('view_region_navigation', { region })
  }

  return {
    filters,
    isLoading: isLoading || !profile,
    error,
    canViewRole,
    canViewTeam,
    canViewArea,
    canViewRegion
  }
} 