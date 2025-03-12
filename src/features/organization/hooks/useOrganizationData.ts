// src/features/organization/hooks/useOrganizationData.ts
'use client'

import { useQuery } from '@tanstack/react-query';
import { getOrganizationStructure } from '../services/organization-service';
import type { OrganizationStructure } from '../types';

export function useOrganizationData() {
  return useQuery<OrganizationStructure>({
    queryKey: ['organization-structure'],
    queryFn: getOrganizationStructure,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });
}