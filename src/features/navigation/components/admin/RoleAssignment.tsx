'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/context/auth-context'
import { useProfile } from '@/features/users/hooks/useProfile'
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
  const { session } = useAuth()
  const { profile } = useProfile(session)
  const { filters, isLoading } = useNavigationFilters(profile)
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

  const renderRoleFilter = (role: RoleType) => (
    <div key={role} className="flex items-center justify-between py-2">
      <Label htmlFor={`role-${role}`} className="flex items-center space-x-2">
        <span>{role}</span>
      </Label>
      <Switch
        id={`role-${role}`}
        checked={safeValue.includes(role)}
        onCheckedChange={() => {
          if (safeValue.includes(role)) {
            onChange(safeValue.filter(v => v !== role))
          } else {
            onChange([...safeValue, role])
          }
        }}
      />
    </div>
  )

  const renderTeamFilter = (team: string) => (
    <div key={team} className="flex items-center justify-between py-2">
      <Label htmlFor={`team-${team}`} className="flex items-center space-x-2">
        <span>{team}</span>
      </Label>
      <Switch
        id={`team-${team}`}
        checked={safeValue.includes(team)}
        onCheckedChange={() => {
          if (safeValue.includes(team)) {
            onChange(safeValue.filter(v => v !== team))
          } else {
            onChange([...safeValue, team])
          }
        }}
      />
    </div>
  )

  const renderAreaFilter = (area: string) => (
    <div key={area} className="flex items-center justify-between py-2">
      <Label htmlFor={`area-${area}`} className="flex items-center space-x-2">
        <span>{area}</span>
      </Label>
      <Switch
        id={`area-${area}`}
        checked={safeValue.includes(area)}
        onCheckedChange={() => {
          if (safeValue.includes(area)) {
            onChange(safeValue.filter(v => v !== area))
          } else {
            onChange([...safeValue, area])
          }
        }}
      />
    </div>
  )

  const renderRegionFilter = (region: string) => (
    <div key={region} className="flex items-center justify-between py-2">
      <Label htmlFor={`region-${region}`} className="flex items-center space-x-2">
        <span>{region}</span>
      </Label>
      <Switch
        id={`region-${region}`}
        checked={safeValue.includes(region)}
        onCheckedChange={() => {
          if (safeValue.includes(region)) {
            onChange(safeValue.filter(v => v !== region))
          } else {
            onChange([...safeValue, region])
          }
        }}
      />
    </div>
  )

  return (
    <Card className={className}>
      <div className="p-4 space-y-6">
        <div>
          <h3 className="font-semibold mb-2">Role Types</h3>
          <div className="space-y-2">
            {availableRoles.map(renderRoleFilter)}
          </div>
        </div>

        {filters.teams.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Teams</h3>
            <div className="space-y-2">
              {filters.teams.map(renderTeamFilter)}
            </div>
          </div>
        )}

        {filters.areas.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Areas</h3>
            <div className="space-y-2">
              {filters.areas.map(renderAreaFilter)}
            </div>
          </div>
        )}

        {filters.regions.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Regions</h3>
            <div className="space-y-2">
              {filters.regions.map(renderRegionFilter)}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              // Clear all selections
              safeValue.forEach(role => onChange(safeValue.filter(v => v !== role)))
            }}
          >
            Clear All
          </Button>
          <Button
            onClick={() => {
              // Select all available roles
              availableRoles.forEach(role => {
                if (!safeValue.includes(role)) {
                  onChange([...safeValue, role])
                }
              })
            }}
          >
            Select All
          </Button>
        </div>
      </div>
    </Card>
  )
} 