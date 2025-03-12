// my-app/src/features/navigation/components/admin/RoleAssignment.tsx

'use client'

import { useState } from 'react'
import { useNavigationFilters } from '../../hooks/useNavigationFilters'
import type { RoleType, NavigationRoleAssignments } from '../../types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface RoleAssignmentProps {
  value: NavigationRoleAssignments;
  onChange: (value: NavigationRoleAssignments) => void;
  className?: string;
}

export function RoleAssignment({
  value = { roleTypes: [], teams: [], areas: [], regions: [] },
  onChange,
  className,
}: RoleAssignmentProps) {
  const { filters, isLoading } = useNavigationFilters()
  const [activeTab, setActiveTab] = useState('roles')
  const [searchQuery, setSearchQuery] = useState('')

  // Toggle handlers for each category
  const handleRoleToggle = (roleType: RoleType) => {
    const newRoles = value.roleTypes.includes(roleType)
      ? value.roleTypes.filter(r => r !== roleType)
      : [...value.roleTypes, roleType]
    
    onChange({
      ...value,
      roleTypes: newRoles
    })
  }

  const handleTeamToggle = (team: string) => {
    const newTeams = value.teams.includes(team)
      ? value.teams.filter(t => t !== team)
      : [...value.teams, team]
    
    onChange({
      ...value,
      teams: newTeams
    })
  }

  const handleAreaToggle = (area: string) => {
    const newAreas = value.areas.includes(area)
      ? value.areas.filter(a => a !== area)
      : [...value.areas, area]
    
    onChange({
      ...value,
      areas: newAreas
    })
  }

  const handleRegionToggle = (region: string) => {
    const newRegions = value.regions.includes(region)
      ? value.regions.filter(r => r !== region)
      : [...value.regions, region]
    
    onChange({
      ...value,
      regions: newRegions
    })
  }

  // Select all handlers for each category
  const handleSelectAllRoles = () => {
    onChange({
      ...value,
      roleTypes: [...filters.roles] as RoleType[]
    })
  }

  const handleSelectAllTeams = () => {
    onChange({
      ...value,
      teams: [...filters.teams]
    })
  }

  const handleSelectAllAreas = () => {
    onChange({
      ...value,
      areas: [...filters.areas]
    })
  }

  const handleSelectAllRegions = () => {
    onChange({
      ...value,
      regions: [...filters.regions]
    })
  }

  // Clear handlers for each category
  const handleClearRoles = () => {
    onChange({
      ...value,
      roleTypes: []
    })
  }

  const handleClearTeams = () => {
    onChange({
      ...value,
      teams: []
    })
  }

  const handleClearAreas = () => {
    onChange({
      ...value,
      areas: []
    })
  }

  const handleClearRegions = () => {
    onChange({
      ...value,
      regions: []
    })
  }

  const filterItems = (items: string[]) => {
    if (!searchQuery) return items
    return items.filter(item => 
      item.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      </Card>
    )
  }

  const renderRoleCategory = () => (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Roles</h3>
          <Badge variant="secondary">{value.roleTypes.length}/{filters.roles.length}</Badge>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSelectAllRoles}
          >
            Select All
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClearRoles}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search roles..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto p-1">
        {filterItems(filters.roles).map(role => (
          <div key={role} className="flex items-center justify-between p-2 border rounded hover:bg-accent">
            <Label 
              htmlFor={`filter-${role}`} 
              className="w-full cursor-pointer"
            >
              {role}
            </Label>
            <Switch
              id={`filter-${role}`}
              checked={value.roleTypes.includes(role as RoleType)}
              onCheckedChange={() => handleRoleToggle(role as RoleType)}
            />
          </div>
        ))}
      </div>
    </div>
  )

  const renderTeamCategory = () => (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Teams</h3>
          <Badge variant="secondary">{value.teams.length}/{filters.teams.length}</Badge>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSelectAllTeams}
          >
            Select All
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClearTeams}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search teams..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto p-1">
        {filterItems(filters.teams).map(team => (
          <div key={team} className="flex items-center justify-between p-2 border rounded hover:bg-accent">
            <Label 
              htmlFor={`filter-${team}`} 
              className="w-full cursor-pointer"
            >
              {team}
            </Label>
            <Switch
              id={`filter-${team}`}
              checked={value.teams.includes(team)}
              onCheckedChange={() => handleTeamToggle(team)}
            />
          </div>
        ))}
      </div>
    </div>
  )

  const renderAreaCategory = () => (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Areas</h3>
          <Badge variant="secondary">{value.areas.length}/{filters.areas.length}</Badge>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSelectAllAreas}
          >
            Select All
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClearAreas}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search areas..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto p-1">
        {filterItems(filters.areas).map(area => (
          <div key={area} className="flex items-center justify-between p-2 border rounded hover:bg-accent">
            <Label 
              htmlFor={`filter-${area}`} 
              className="w-full cursor-pointer"
            >
              {area}
            </Label>
            <Switch
              id={`filter-${area}`}
              checked={value.areas.includes(area)}
              onCheckedChange={() => handleAreaToggle(area)}
            />
          </div>
        ))}
      </div>
    </div>
  )

  const renderRegionCategory = () => (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Regions</h3>
          <Badge variant="secondary">{value.regions.length}/{filters.regions.length}</Badge>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSelectAllRegions}
          >
            Select All
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClearRegions}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search regions..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto p-1">
        {filterItems(filters.regions).map(region => (
          <div key={region} className="flex items-center justify-between p-2 border rounded hover:bg-accent">
            <Label 
              htmlFor={`filter-${region}`} 
              className="w-full cursor-pointer"
            >
              {region}
            </Label>
            <Switch
              id={`filter-${region}`}
              checked={value.regions.includes(region)}
              onCheckedChange={() => handleRegionToggle(region)}
            />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <Card className={className}>
      <div className="p-4">
        <Tabs defaultValue="roles" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="roles" className="relative">
              Roles
              {value.roleTypes.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                  {value.roleTypes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="teams" className="relative">
              Teams
              {value.teams.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                  {value.teams.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="areas" className="relative">
              Areas
              {value.areas.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                  {value.areas.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="regions" className="relative">
              Regions
              {value.regions.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                  {value.regions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="roles" className="mt-4">
            {renderRoleCategory()}
          </TabsContent>
          
          <TabsContent value="teams" className="mt-4">
            {renderTeamCategory()}
          </TabsContent>
          
          <TabsContent value="areas" className="mt-4">
            {renderAreaCategory()}
          </TabsContent>
          
          <TabsContent value="regions" className="mt-4">
            {renderRegionCategory()}
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-between mt-6">
          <div className="text-sm text-muted-foreground">
            {value.roleTypes.length + value.teams.length + value.areas.length + value.regions.length} items selected
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onChange({ roleTypes: [], teams: [], areas: [], regions: [] })}
            >
              Clear All
            </Button>
            <Button
              onClick={() => onChange({
                roleTypes: [...filters.roles] as RoleType[],
                teams: [...filters.teams],
                areas: [...filters.areas],
                regions: [...filters.regions]
              })}
            >
              Select All
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}