import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

// Define the filter structure for multi-select
export interface RecipientFilter {
  roleTypes: string[];
  teams: string[];
  areas: string[];
  regions: string[];
}

// Props for the RecipientSelector component
interface RecipientSelectorProps {
  filter: RecipientFilter;
  onChange: (filter: RecipientFilter) => void;
  onPreviewRequest: () => void;
  disabled?: boolean;
}

// Organization structure interface
interface OrganizationStructure {
  roleTypes: string[];
  teams: string[];
  areas: string[];
  regions: string[];
}

// Fetch organization structure
const fetchOrganizationStructure = async (): Promise<OrganizationStructure> => {
  console.log('[RecipientSelector] Fetching organization structure');
  const response = await fetch('/api/organization-structure');
  
  if (!response.ok) {
    throw new Error('Failed to fetch organization structure');
  }
  
  const data = await response.json();
  console.log('[RecipientSelector] Received organization structure:', data);
  return data;
};

export function RecipientSelector({ 
  filter = { roleTypes: [], teams: [], areas: [], regions: [] }, 
  onChange, 
  onPreviewRequest,
  disabled = false 
}: RecipientSelectorProps) {
  const [activeTab, setActiveTab] = useState('roleTypes');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  
  // Fetch organization structure
  const { data: orgStructure, isLoading, isError } = useQuery<OrganizationStructure>({
    queryKey: ['organization-structure'],
    queryFn: fetchOrganizationStructure,
  });
  
  // Toggle handlers for each category
  const handleRoleToggle = (roleType: string) => {
    const newRoles = filter.roleTypes.includes(roleType)
      ? filter.roleTypes.filter(r => r !== roleType)
      : [...filter.roleTypes, roleType];
    
    onChange({
      ...filter,
      roleTypes: newRoles
    });
  };

  const handleTeamToggle = (team: string) => {
    const newTeams = filter.teams.includes(team)
      ? filter.teams.filter(t => t !== team)
      : [...filter.teams, team];
    
    onChange({
      ...filter,
      teams: newTeams
    });
  };

  const handleAreaToggle = (area: string) => {
    const newAreas = filter.areas.includes(area)
      ? filter.areas.filter(a => a !== area)
      : [...filter.areas, area];
    
    onChange({
      ...filter,
      areas: newAreas
    });
  };

  const handleRegionToggle = (region: string) => {
    const newRegions = filter.regions.includes(region)
      ? filter.regions.filter(r => r !== region)
      : [...filter.regions, region];
    
    onChange({
      ...filter,
      regions: newRegions
    });
  };
  
  // Select all handlers for each category
  const handleSelectAllRoles = () => {
    if (orgStructure?.roleTypes) {
      onChange({
        ...filter,
        roleTypes: [...orgStructure.roleTypes]
      });
    }
  };

  const handleSelectAllTeams = () => {
    if (orgStructure?.teams) {
      onChange({
        ...filter,
        teams: [...orgStructure.teams]
      });
    }
  };

  const handleSelectAllAreas = () => {
    if (orgStructure?.areas) {
      onChange({
        ...filter,
        areas: [...orgStructure.areas]
      });
    }
  };

  const handleSelectAllRegions = () => {
    if (orgStructure?.regions) {
      onChange({
        ...filter,
        regions: [...orgStructure.regions]
      });
    }
  };
  
  // Clear handlers for each category
  const handleClearRoles = () => {
    onChange({
      ...filter,
      roleTypes: []
    });
  };

  const handleClearTeams = () => {
    onChange({
      ...filter,
      teams: []
    });
  };

  const handleClearAreas = () => {
    onChange({
      ...filter,
      areas: []
    });
  };

  const handleClearRegions = () => {
    onChange({
      ...filter,
      regions: []
    });
  };
  
  // Filter items based on search query
  const filterItems = (items: string[] = []) => {
    if (!searchQuery) return items;
    return items.filter(item => 
      item.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  // Handle preview request
  const handlePreviewClick = () => {
    // Check if any filters are applied
    const hasFilters = 
      filter.roleTypes.length > 0 || 
      filter.teams.length > 0 || 
      filter.areas.length > 0 || 
      filter.regions.length > 0;
    
    if (!hasFilters) {
      toast({
        variant: "destructive",
        title: "No filters selected",
        description: "Please select at least one filter to preview recipients.",
      });
      return;
    }
    
    // Count total filters applied
    const totalFilters = 
      filter.roleTypes.length + 
      filter.teams.length + 
      filter.areas.length + 
      filter.regions.length;
    
    toast({
      title: "Previewing recipients",
      description: `Requesting preview with ${totalFilters} filter${totalFilters !== 1 ? 's' : ''}.`,
    });
    
    onPreviewRequest();
  };
  
  // Check if any filters are applied - use this in the UI
  const hasAnyFilters = useMemo(() => {
    return (
      filter.roleTypes.length > 0 ||
      filter.teams.length > 0 ||
      filter.areas.length > 0 ||
      filter.regions.length > 0
    );
  }, [filter.roleTypes.length, filter.teams.length, filter.areas.length, filter.regions.length]);
  
  // Handle select all filters
  const handleSelectAll = () => {
    if (orgStructure) {
      onChange({
        roleTypes: [...(orgStructure.roleTypes || [])],
        teams: [...(orgStructure.teams || [])],
        areas: [...(orgStructure.areas || [])],
        regions: [...(orgStructure.regions || [])]
      });
    }
  };
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Select Recipients</CardTitle>
          <CardDescription>
            Loading organization structure...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isError) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Select Recipients</CardTitle>
          <CardDescription>
            Error loading organization structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load organization structure. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  const renderRoleCategory = () => (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Roles</h3>
          <Badge variant="secondary">{filter.roleTypes.length}/{orgStructure?.roleTypes.length || 0}</Badge>
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
        {filterItems(orgStructure?.roleTypes || []).map(role => (
          <div key={role} className="flex items-center justify-between p-2 border rounded hover:bg-accent">
            <Label 
              htmlFor={`filter-role-${role}`} 
              className="w-full cursor-pointer"
            >
              {role}
            </Label>
            <Switch
              id={`filter-role-${role}`}
              checked={filter.roleTypes.includes(role)}
              onCheckedChange={() => handleRoleToggle(role)}
              disabled={disabled}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderTeamCategory = () => (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Teams</h3>
          <Badge variant="secondary">{filter.teams.length}/{orgStructure?.teams.length || 0}</Badge>
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
        {filterItems(orgStructure?.teams || []).map(team => (
          <div key={team} className="flex items-center justify-between p-2 border rounded hover:bg-accent">
            <Label 
              htmlFor={`filter-team-${team}`} 
              className="w-full cursor-pointer"
            >
              {team}
            </Label>
            <Switch
              id={`filter-team-${team}`}
              checked={filter.teams.includes(team)}
              onCheckedChange={() => handleTeamToggle(team)}
              disabled={disabled}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderAreaCategory = () => (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Areas</h3>
          <Badge variant="secondary">{filter.areas.length}/{orgStructure?.areas.length || 0}</Badge>
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
        {filterItems(orgStructure?.areas || []).map(area => (
          <div key={area} className="flex items-center justify-between p-2 border rounded hover:bg-accent">
            <Label 
              htmlFor={`filter-area-${area}`} 
              className="w-full cursor-pointer"
            >
              {area}
            </Label>
            <Switch
              id={`filter-area-${area}`}
              checked={filter.areas.includes(area)}
              onCheckedChange={() => handleAreaToggle(area)}
              disabled={disabled}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderRegionCategory = () => (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Regions</h3>
          <Badge variant="secondary">{filter.regions.length}/{orgStructure?.regions.length || 0}</Badge>
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
        {filterItems(orgStructure?.regions || []).map(region => (
          <div key={region} className="flex items-center justify-between p-2 border rounded hover:bg-accent">
            <Label 
              htmlFor={`filter-region-${region}`} 
              className="w-full cursor-pointer"
            >
              {region}
            </Label>
            <Switch
              id={`filter-region-${region}`}
              checked={filter.regions.includes(region)}
              onCheckedChange={() => handleRegionToggle(region)}
              disabled={disabled}
            />
          </div>
        ))}
      </div>
    </div>
  );
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Select Recipients</CardTitle>
        <CardDescription>
          Filter recipients by organizational structure
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="roleTypes" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="roleTypes" className="relative">
              Roles
              {filter.roleTypes.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                  {filter.roleTypes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="teams" className="relative">
              Teams
              {filter.teams.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                  {filter.teams.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="areas" className="relative">
              Areas
              {filter.areas.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                  {filter.areas.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="regions" className="relative">
              Regions
              {filter.regions.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                  {filter.regions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="roleTypes" className="mt-4">
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
        
        {/* Active Filters Display */}
        <div className="pt-4">
          <Label>Active Filters:</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {!hasAnyFilters ? (
              <span className="text-muted-foreground text-sm">No filters applied (all recipients)</span>
            ) : (
              <>
                {filter.roleTypes.map(role => (
                  <Badge key={`role-${role}`} variant="secondary" className="text-xs">
                    Role: {role}
                  </Badge>
                ))}
                {filter.teams.map(team => (
                  <Badge key={`team-${team}`} variant="secondary" className="text-xs">
                    Team: {team}
                  </Badge>
                ))}
                {filter.areas.map(area => (
                  <Badge key={`area-${area}`} variant="secondary" className="text-xs">
                    Area: {area}
                  </Badge>
                ))}
                {filter.regions.map(region => (
                  <Badge key={`region-${region}`} variant="secondary" className="text-xs">
                    Region: {region}
                  </Badge>
                ))}
              </>
            )}
          </div>
        </div>
        
        {/* Preview Button */}
        <Button 
          onClick={handlePreviewClick}
          disabled={disabled}
          className="w-full mt-4"
        >
          Preview Recipients
        </Button>
        
        <div className="flex justify-between mt-6">
          <div className="text-sm text-muted-foreground">
            {filter.roleTypes.length + filter.teams.length + filter.areas.length + filter.regions.length} filters selected
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onChange({ roleTypes: [], teams: [], areas: [], regions: [] })}
            >
              Clear All
            </Button>
            <Button
              onClick={handleSelectAll}
            >
              Select All
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 