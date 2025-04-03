// src/features/organization/types/index.ts
/**
 * Organization structure interface
 * Contains the hierarchical structure of the organization
 */
export interface OrganizationStructure {
    roleTypes: string[];
    teams: string[];
    areas: string[];
    regions: string[];
  }

/**
 * Organization filter interface
 * Used for filtering users by organizational attributes
 */
export interface OrganizationFilter {
  roleType?: string | null;
  team?: string | null;
  area?: string | null;
  region?: string | null;
}

/**
 * Organization service response interface
 * Used for API responses from the organization service
 */
export interface OrganizationServiceResponse {
  success: boolean;
  data?: OrganizationStructure;
  error?: string;
}