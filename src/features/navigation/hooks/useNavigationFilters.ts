'use client'

import { useMemo } from 'react'
import { usePermissions } from '@/features/permissions/hooks/usePermissions'
import type { UserProfile } from '@/features/users/types'
import type { RoleType, NavigationFilters } from '@/features/permissions/types'

interface UseNavigationFiltersResult {
  filters: NavigationFilters
  isLoading: boolean
  error: Error | null
  canViewRole: (role: RoleType) => Promise<boolean>
  canViewTeam: (team: string) => Promise<boolean>
  canViewArea: (area: string) => Promise<boolean>
  canViewRegion: (region: string) => Promise<boolean>
}

export function useNavigationFilters(profile: UserProfile | null): UseNavigationFiltersResult {
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
    return can('view_navigation', { role })
  }

  const canViewTeam = async (team: string): Promise<boolean> => {
    return can('view_navigation', { team })
  }

  const canViewArea = async (area: string): Promise<boolean> => {
    return can('view_navigation', { area })
  }

  const canViewRegion = async (region: string): Promise<boolean> => {
    return can('view_navigation', { region })
  }

  return {
    filters,
    isLoading,
    error,
    canViewRole,
    canViewTeam,
    canViewArea,
    canViewRegion
  }
} 