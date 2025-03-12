import { useState, useEffect } from 'react'

interface OrganizationStructure {
  roleTypes: string[]
  teams: string[]
  areas: string[]
  regions: string[]
}

interface UseRoleFiltersReturn {
  filters: {
    roles: string[]
    teams: string[]
    areas: string[]
    regions: string[]
  }
  isLoading: boolean
  error: Error | null
}

export function useRoleFilters(): UseRoleFiltersReturn {
  const [filters, setFilters] = useState<{
    roles: string[]
    teams: string[]
    areas: string[]
    regions: string[]
  }>({
    roles: [],
    teams: [],
    areas: [],
    regions: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchOrganizationStructure = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/organization-structure')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch organization structure: ${response.status}`)
        }
        
        const data: OrganizationStructure = await response.json()
        
        setFilters({
          roles: data.roleTypes || [],
          teams: data.teams || [],
          areas: data.areas || [],
          regions: data.regions || []
        })
        setError(null)
      } catch (err) {
        console.error('Error fetching organization structure:', err)
        setError(err instanceof Error ? err : new Error(String(err)))
        // Set default values in case of error
        setFilters({
          roles: [],
          teams: [],
          areas: [],
          regions: []
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrganizationStructure()
  }, [])

  return { filters, isLoading, error }
} 