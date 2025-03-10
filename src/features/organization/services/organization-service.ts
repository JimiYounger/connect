// src/features/organization/services/organization-service.ts
'use client'

import { createClient } from '@/lib/supabase';
import type { OrganizationStructure } from '../types';

// src/features/organization/services/organization-service.ts
export async function getOrganizationStructure(): Promise<OrganizationStructure> {
    try {
      console.log('Fetching organization data from API...');
      
      // Use server API route to avoid RLS issues
      const response = await fetch('/api/organization-structure');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Organization data received:', data);
      
      return {
        roleTypes: data.roleTypes || ['Setter', 'Closer', 'Manager', 'Executive', 'Admin'],
        teams: data.teams || [],
        areas: data.areas || [],
        regions: data.regions || []
      };
    } catch (error) {
      console.error('Failed to fetch organization structure:', error);
      
      // Fallback to defaults
      return {
        roleTypes: ['Setter', 'Closer', 'Manager', 'Executive', 'Admin'],
        teams: [],
        areas: [],
        regions: []
      };
    }
  }