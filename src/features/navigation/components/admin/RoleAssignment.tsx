// my-app/src/features/navigation/components/admin/RoleAssignment.tsx

'use client'

import { useState, useEffect } from 'react'
import { useNavigationFilters } from '../../hooks/useNavigationFilters'
import type { RoleType } from '@/features/permissions/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

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
  const [activeTab, setActiveTab] = useState('roles')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCount, setSelectedCount] = useState({
    roles: 0,
    teams: 0,
    areas: 0,
    regions: 0
  })

  // Ensure value is always an array
  const safeValue = Array.isArray(value) ? value : []

  // Update selected counts when value changes
  useEffect(() => {
    const counts = {
      roles: filters.roles.filter(role => safeValue.includes(role)).length,
      teams: filters.teams.filter(team => safeValue.includes(team)).length,
      areas: filters.areas.filter(area => safeValue.includes(area)).length,
      regions: filters.regions.filter(region => safeValue.includes(region)).length
    }
    setSelectedCount(counts)
  }, [safeValue, filters])

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

  const handleSelectAll = (items: string[]) => {
    const newValues = [...safeValue]
    
    // Add all items that aren't already selected
    items.forEach(item => {
      if (!newValues.includes(item)) {
        newValues.push(item)
      }
    })
    
    onChange(newValues)
  }

  const handleDeselectAll = (items: string[]) => {
    onChange(safeValue.filter(v => !items.includes(v)))
  }

  const filterItems = (items: string[]) => {
    if (!searchQuery) return items
    return items.filter(item => 
      item.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const renderCategory = (title: string, items: string[], selectedItems: number) => {
    const filteredItems = filterItems(items)
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{title}</h3>
            <Badge variant="secondary">{selectedItems}/{items.length}</Badge>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleSelectAll(items)}
            >
              Select All
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleDeselectAll(items)}
            >
              Clear
            </Button>
          </div>
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${title.toLowerCase()}...`}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto p-1">
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <div key={item} className="flex items-center justify-between p-2 border rounded hover:bg-accent">
                <Label 
                  htmlFor={`filter-${item}`} 
                  className="w-full cursor-pointer"
                >
                  {item}
                </Label>
                <Switch
                  id={`filter-${item}`}
                  checked={safeValue.includes(item)}
                  onCheckedChange={() => handleToggle(item)}
                />
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-4 text-muted-foreground">
              No {title.toLowerCase()} found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className={className}>
      <div className="p-4">
        <Tabs defaultValue="roles" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="roles" className="relative">
              Roles
              {selectedCount.roles > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                  {selectedCount.roles}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="teams" className="relative">
              Teams
              {selectedCount.teams > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                  {selectedCount.teams}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="areas" className="relative">
              Areas
              {selectedCount.areas > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                  {selectedCount.areas}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="regions" className="relative">
              Regions
              {selectedCount.regions > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                  {selectedCount.regions}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="roles" className="mt-4">
            {renderCategory('Roles', filters.roles, selectedCount.roles)}
          </TabsContent>
          
          <TabsContent value="teams" className="mt-4">
            {renderCategory('Teams', filters.teams, selectedCount.teams)}
          </TabsContent>
          
          <TabsContent value="areas" className="mt-4">
            {renderCategory('Areas', filters.areas, selectedCount.areas)}
          </TabsContent>
          
          <TabsContent value="regions" className="mt-4">
            {renderCategory('Regions', filters.regions, selectedCount.regions)}
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-between mt-6">
          <div className="text-sm text-muted-foreground">
            {safeValue.length} items selected
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onChange([])}
            >
              Clear All
            </Button>
            <Button
              onClick={() => {
                const allValues = [
                  ...filters.roles,
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
      </div>
    </Card>
  )
}