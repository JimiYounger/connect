// src/features/organization/utils/role-helpers.ts
import type { OrganizationStructure } from '../types';

export interface RoleData {
  role_type: string | null;
  team: string | null;
  area: string | null;
  region: string | null;
}

/**
 * Determines which category a value belongs to (role type, team, area, or region)
 */
export function categorizeRoleValue(
  value: string, 
  orgData: OrganizationStructure
): RoleData {
  const roleData: RoleData = {
    role_type: null,
    team: null,
    area: null,
    region: null
  };
  
  if (orgData.roleTypes.includes(value)) {
    roleData.role_type = value;
  } else if (orgData.teams.includes(value)) {
    roleData.team = value;
  } else if (orgData.areas.includes(value)) {
    roleData.area = value;
  } else if (orgData.regions.includes(value)) {
    roleData.region = value;
  } else {
    // Default to role_type if not found
    roleData.role_type = value;
  }
  
  return roleData;
}