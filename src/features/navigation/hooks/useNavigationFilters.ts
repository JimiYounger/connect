// src/features/navigation/hooks/useNavigationFilters.ts
'use client'

import { useMemo } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { useProfile } from '@/features/users/hooks/useProfile';
import { usePermissions } from '@/features/permissions/hooks/usePermissions';
import { useOrganizationData } from '@/features/organization/hooks/useOrganizationData';
import type { 
  RoleType, 
  NavigationFilters
} from '@/features/permissions/types';

interface UseNavigationFiltersResult {
  filters: NavigationFilters;
  isLoading: boolean;
  error: Error | null;
  canViewRole: (role: RoleType) => Promise<boolean>;
  canViewTeam: (team: string) => Promise<boolean>;
  canViewArea: (area: string) => Promise<boolean>;
  canViewRegion: (region: string) => Promise<boolean>;
}

export function useNavigationFilters(): UseNavigationFiltersResult {
  const { session } = useAuth();
  const { profile } = useProfile(session);
  const { userPermissions, can, isLoading: permissionsLoading, error: permissionsError } = usePermissions(profile);
  const { data: orgData, isLoading: orgLoading, error: orgError } = useOrganizationData();

  const filters = useMemo<NavigationFilters>(() => {
    // Define valid role types
    const validRoleTypes: RoleType[] = ['Setter', 'Closer', 'Manager', 'Executive', 'Admin'];
    
    // Log what we have
    console.log('🔍 Navigation filters data:', {
      hasOrgData: !!orgData,
      orgData,
      userPermissions
    });
    
    // Use organization data if available at all
    if (orgData) {
      console.log('Using org data for filters:', orgData);
      return {
        // Filter to only include valid role types
        roles: (orgData.roleTypes.filter(role => 
          validRoleTypes.includes(role as RoleType)
        ) as RoleType[]),
        teams: orgData.teams || [],
        areas: orgData.areas || [],
        regions: orgData.regions || []
      };
    }
  
    // Fall back to hardcoded roles and user-specific data
    console.log('Falling back to user data for filters');
    return {
      roles: validRoleTypes,
      teams: userPermissions?.team ? [userPermissions.team] : [],
      areas: userPermissions?.area ? [userPermissions.area] : [],
      regions: userPermissions?.region ? [userPermissions.region] : []
    };
  }, [userPermissions, orgData]);

  // Your existing permission check methods
  const canViewRole = async (role: RoleType): Promise<boolean> => {
    if (!userPermissions) return false;
    const roleHierarchy: Record<RoleType, number> = {
      'Admin': 5,
      'Executive': 4,
      'Manager': 3,
      'Closer': 2,
      'Setter': 1
    };
    const userRoleLevel = roleHierarchy[userPermissions.roleType] || 0;
    const targetRoleLevel = roleHierarchy[role] || 0;
    
    return userRoleLevel >= targetRoleLevel && await can('view_role_navigation');
  };

  const canViewTeam = async (team: string): Promise<boolean> => {
    return can('view_team_navigation', { team });
  };

  const canViewArea = async (area: string): Promise<boolean> => {
    return can('view_area_navigation', { area });
  };

  const canViewRegion = async (region: string): Promise<boolean> => {
    return can('view_region_navigation', { region });
  };

  return {
    filters,
    isLoading: permissionsLoading || orgLoading || !profile,
    error: permissionsError || orgError,
    canViewRole,
    canViewTeam,
    canViewArea,
    canViewRegion
  };
}