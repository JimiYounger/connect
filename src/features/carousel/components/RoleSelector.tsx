// src/features/carousel/components/RoleSelector.tsx

'use client'

import { useState } from 'react'
import { Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRoleFilters } from '../hooks/useRoleFilters'
import type { RoleAssignments } from '../types'

interface RoleSelectorProps {
  value: RoleAssignments;
  onChange: (value: RoleAssignments) => void;
  className?: string;
}

export function RoleSelector({
  value = { roleTypes: [], teams: [], areas: [], regions: [] },
  onChange,
  className,
}: RoleSelectorProps) {
  // Ensure value has all required properties with defaults
  const safeValue: RoleAssignments = {
    roleTypes: value?.roleTypes || [],
    teams: value?.teams || [],
    areas: value?.areas || [],
    regions: value?.regions || []
  }

  const { filters = { roles: [], teams: [], areas: [], regions: [] }, isLoading } = useRoleFilters()
  const [activeTab, setActiveTab] = useState('roles')
  const [searchQuery, setSearchQuery] = useState('')

  // Toggle handlers for each category
  const handleRoleToggle = (roleType: string) => {
    const newRoles = safeValue.roleTypes.includes(roleType)
      ? safeValue.roleTypes.filter(r => r !== roleType)
      : [...safeValue.roleTypes, roleType]
    
    onChange({
      ...safeValue,
      roleTypes: newRoles
    })
  }

  const handleTeamToggle = (team: string) => {
    const newTeams = safeValue.teams.includes(team)
      ? safeValue.teams.filter(t => t !== team)
      : [...safeValue.teams, team]
    
    onChange({
      ...safeValue,
      teams: newTeams
    })
  }

  const handleAreaToggle = (area: string) => {
    const newAreas = safeValue.areas.includes(area)
      ? safeValue.areas.filter(a => a !== area)
      : [...safeValue.areas, area]
    
    onChange({
      ...safeValue,
      areas: newAreas
    })
  }

  const handleRegionToggle = (region: string) => {
    const newRegions = safeValue.regions.includes(region)
      ? safeValue.regions.filter(r => r !== region)
      : [...safeValue.regions, region]
    
    onChange({
      ...safeValue,
      regions: newRegions
    })
  }

  // Select all handlers for each category
  const handleSelectAllRoles = () => {
    onChange({
      ...safeValue,
      roleTypes: [...(filters.roles || [])]
    })
  }

  const handleSelectAllTeams = () => {
    onChange({
      ...safeValue,
      teams: [...(filters.teams || [])]
    })
  }

  const handleSelectAllAreas = () => {
    onChange({
      ...safeValue,
      areas: [...(filters.areas || [])]
    })
  }

  const handleSelectAllRegions = () => {
    onChange({
      ...safeValue,
      regions: [...(filters.regions || [])]
    })
  }

  // Clear handlers for each category
  const handleClearRoles = () => {
    onChange({
      ...safeValue,
      roleTypes: []
    })
  }

  const handleClearTeams = () => {
    onChange({
      ...safeValue,
      teams: []
    })
  }

  const handleClearAreas = () => {
    onChange({
      ...safeValue,
      areas: []
    })
  }

  const handleClearRegions = () => {
    onChange({
      ...safeValue,
      regions: []
    })
  }

  const filterItems = (items: string[] = []) => {
    if (!searchQuery) return items
    return items.filter(item => 
      item.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  // Calculate the number of database records that will be created
  const calculateAssignmentCount = () => {
    const roleTypes = safeValue.roleTypes;
    const teams = safeValue.teams;
    const areas = safeValue.areas;
    const regions = safeValue.regions;
    
    // If no selections at all, return 0 (visible to all)
    if (roleTypes.length === 0 && teams.length === 0 && areas.length === 0 && regions.length === 0) {
      return 0;
    }
    
    // If only roles are selected (no locations)
    if (roleTypes.length > 0 && teams.length === 0 && areas.length === 0 && regions.length === 0) {
      return roleTypes.length;
    }
    
    // Calculate total assignments
    let totalAssignments = 0;
    
    // If we have locations (teams, areas, regions)
    const locationCount = teams.length + areas.length + regions.length;
    
    if (locationCount > 0) {
      // If no roles are selected, we'll use 'Any' role (1 role)
      const effectiveRoleCount = roleTypes.length > 0 ? roleTypes.length : 1;
      
      // Each team gets paired with each role
      if (teams.length > 0) {
        totalAssignments += teams.length * effectiveRoleCount;
      }
      
      // Each area gets paired with each role
      if (areas.length > 0) {
        totalAssignments += areas.length * effectiveRoleCount;
      }
      
      // Each region gets paired with each role
      if (regions.length > 0) {
        totalAssignments += regions.length * effectiveRoleCount;
      }
    }
    
    return totalAssignments;
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
          <Badge variant="secondary">{safeValue.roleTypes.length}/{filters.roles?.length || 0}</Badge>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSelectAllRoles}
            type="button"
          >
            Select All
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClearRoles}
            type="button"
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
              htmlFor={`role-filter-${role}`} 
              className="w-full cursor-pointer"
            >
              {role}
            </Label>
            <Switch
              id={`role-filter-${role}`}
              checked={safeValue.roleTypes.includes(role)}
              onCheckedChange={() => handleRoleToggle(role)}
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
          <Badge variant="secondary">{safeValue.teams.length}/{filters.teams?.length || 0}</Badge>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSelectAllTeams}
            type="button"
          >
            Select All
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClearTeams}
            type="button"
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
              htmlFor={`team-filter-${team}`} 
              className="w-full cursor-pointer"
            >
              {team}
            </Label>
            <Switch
              id={`team-filter-${team}`}
              checked={safeValue.teams.includes(team)}
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
          <Badge variant="secondary">{safeValue.areas.length}/{filters.areas?.length || 0}</Badge>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSelectAllAreas}
            type="button"
          >
            Select All
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClearAreas}
            type="button"
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
              htmlFor={`area-filter-${area}`} 
              className="w-full cursor-pointer"
            >
              {area}
            </Label>
            <Switch
              id={`area-filter-${area}`}
              checked={safeValue.areas.includes(area)}
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
          <Badge variant="secondary">{safeValue.regions.length}/{filters.regions?.length || 0}</Badge>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSelectAllRegions}
            type="button"
          >
            Select All
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClearRegions}
            type="button"
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
              htmlFor={`region-filter-${region}`} 
              className="w-full cursor-pointer"
            >
              {region}
            </Label>
            <Switch
              id={`region-filter-${region}`}
              checked={safeValue.regions.includes(region)}
              onCheckedChange={() => handleRegionToggle(region)}
            />
          </div>
        ))}
      </div>
    </div>
  )

  // Get the actual count of assignments that will be created
  const assignmentCount = calculateAssignmentCount();
  
  return (
    <Card className={className}>
      <div className="p-4">
        <Tabs defaultValue="roles" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="roles" className="relative">
              Roles
              {safeValue.roleTypes.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                  {safeValue.roleTypes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="teams" className="relative">
              Teams
              {safeValue.teams.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                  {safeValue.teams.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="areas" className="relative">
              Areas
              {safeValue.areas.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                  {safeValue.areas.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="regions" className="relative">
              Regions
              {safeValue.regions.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                  {safeValue.regions.length}
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
            {assignmentCount} {assignmentCount === 1 ? 'assignment' : 'assignments'} will be created
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onChange({ roleTypes: [], teams: [], areas: [], regions: [] })}
              type="button"
            >
              Clear All
            </Button>
            <Button
              onClick={() => onChange({
                roleTypes: [...(filters.roles || [])],
                teams: [...(filters.teams || [])],
                areas: [...(filters.areas || [])],
                regions: [...(filters.regions || [])]
              })}
              type="button"
            >
              Select All
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}