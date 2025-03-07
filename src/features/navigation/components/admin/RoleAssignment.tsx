'use client'

import { useState, useEffect } from 'react'
import { useNavigationFilters } from '../../hooks/useNavigationFilters'
import type { RoleType } from '@/features/permissions/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface RoleAssignmentProps {
  value: string[]
  onChange: (value: string[]) => void
  className?: string
}

export function RoleAssignment({
  value = [],
  onChange,
  className,
}: RoleAssignmentProps) {
  const { filters, isLoading } = useNavigationFilters()
  const [availableRoles, setAvailableRoles] = useState<RoleType[]>([])

  // Filter available roles based on permissions
  useEffect(() => {
    setAvailableRoles(filters.roles)
  }, [filters.roles])

  // Ensure value is always an array
  const safeValue = Array.isArray(value) ? value : []

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      </Card>
    )
  }

  const handleToggle = (toggleValue: string) => {
    onChange(
      safeValue.includes(toggleValue)
        ? safeValue.filter((v: string) => v !== toggleValue)
        : [...safeValue, toggleValue]
    )
  }

  const renderFilterItem = (itemValue: string, label: string) => (
    <div key={itemValue} className="flex items-center justify-between py-2">
      <Label htmlFor={`filter-${itemValue}`} className="flex items-center space-x-2">
        <span>{label}</span>
      </Label>
      <Switch
        id={`filter-${itemValue}`}
        checked={safeValue.includes(itemValue)}
        onCheckedChange={() => handleToggle(itemValue)}
      />
    </div>
  )

  return (
    <Card className={className}>
      <div className="p-4 space-y-6">
        <div>
          <h3 className="font-semibold mb-2">Role Types</h3>
          <div className="space-y-2">
            {availableRoles.map(role => renderFilterItem(role, role))}
          </div>
        </div>

        {filters.teams.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Teams</h3>
            <div className="space-y-2">
              {filters.teams.map(team => renderFilterItem(team, team))}
            </div>
          </div>
        )}

        {filters.areas.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Areas</h3>
            <div className="space-y-2">
              {filters.areas.map(area => renderFilterItem(area, area))}
            </div>
          </div>
        )}

        {filters.regions.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Regions</h3>
            <div className="space-y-2">
              {filters.regions.map(region => renderFilterItem(region, region))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => onChange([])}
          >
            Clear All
          </Button>
          <Button
            onClick={() => {
              const allValues = [
                ...availableRoles,
                ...filters.teams,
                ...filters.areas,
                ...filters.regions
              ]
              onChange(allValues)
            }}
          >
            Select All
          </Button>
        </div>
      </div>
    </Card>
  )
} 