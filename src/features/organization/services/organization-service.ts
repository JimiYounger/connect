// src/features/organization/services/organization-service.ts
'use client'

import type { OrganizationStructure } from '../types';

/**
 * Fetches the organization structure from the API
 */
export async function getOrganizationStructure(): Promise<OrganizationStructure> {
  try {
    const response = await fetch('/api/organization-structure');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch organization structure: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching organization structure:', error);
    // Return default empty structure
    return {
      roleTypes: [],
      teams: [],
      areas: [],
      regions: []
    };
  }
}