// my-app/src/features/navigation/components/admin/NavigationPreview.tsx

'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigationFilters } from '../../hooks/useNavigationFilters'
import type { RoleType } from '@/features/permissions/types'
import type { NavigationItemWithChildren } from '../../types'

interface NavigationPreviewProps {
  items: NavigationItemWithChildren[]
  selectedRoles?: string[]
  onRoleToggle?: (role: string) => void
  className?: string
}

export function NavigationPreview({
  items,
  selectedRoles = [],
  onRoleToggle = () => {},
  className,
}: NavigationPreviewProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const { filters } = useNavigationFilters()
  const [availableRoles, setAvailableRoles] = useState<RoleType[]>([])

  // Filter available roles based on permissions
  useEffect(() => {
    setAvailableRoles(filters.roles)
  }, [filters.roles])

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    )
  }

  const renderItem = (item: NavigationItemWithChildren, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.id)

    return (
      <div key={item.id} className="w-full">
        <div
          className={cn(
            'flex items-center py-2 px-4 hover:bg-gray-100 cursor-pointer',
            { 'bg-gray-50': isExpanded }
          )}
          style={{ paddingLeft: `${depth * 16 + 16}px` }}
          onClick={() => hasChildren && toggleExpand(item.id)}
        >
          {hasChildren && (
            <span className="mr-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </span>
          )}
          <span>{item.title}</span>
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {item.children?.map((child) => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const renderRoleFilter = (role: RoleType) => (
    <label
      key={role}
      className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-100 rounded"
    >
      <input
        type="checkbox"
        checked={selectedRoles.includes(role)}
        onChange={() => onRoleToggle(role)}
        className="form-checkbox"
      />
      <span>{role}</span>
    </label>
  )

  const renderTeamFilter = (team: string) => (
    <label
      key={team}
      className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-100 rounded"
    >
      <input
        type="checkbox"
        checked={selectedRoles.includes(team)}
        onChange={() => onRoleToggle(team)}
        className="form-checkbox"
      />
      <span>{team}</span>
    </label>
  )

  const renderAreaFilter = (area: string) => (
    <label
      key={area}
      className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-100 rounded"
    >
      <input
        type="checkbox"
        checked={selectedRoles.includes(area)}
        onChange={() => onRoleToggle(area)}
        className="form-checkbox"
      />
      <span>{area}</span>
    </label>
  )

  const renderRegionFilter = (region: string) => (
    <label
      key={region}
      className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-100 rounded"
    >
      <input
        type="checkbox"
        checked={selectedRoles.includes(region)}
        onChange={() => onRoleToggle(region)}
        className="form-checkbox"
      />
      <span>{region}</span>
    </label>
  )

  return (
    <div className={cn('w-full', className)}>
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div>
          <h3 className="font-semibold mb-2">Role Types</h3>
          <div className="space-y-1">
            {availableRoles.map(renderRoleFilter)}
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Teams</h3>
          <div className="space-y-1">{filters.teams.map(renderTeamFilter)}</div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Areas</h3>
          <div className="space-y-1">{filters.areas.map(renderAreaFilter)}</div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Regions</h3>
          <div className="space-y-1">{filters.regions.map(renderRegionFilter)}</div>
        </div>
      </div>
      <div className="border rounded-lg">
        {items.map((item) => renderItem(item))}
      </div>
    </div>
  )
} 