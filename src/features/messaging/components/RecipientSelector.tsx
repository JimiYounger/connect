import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Define the filter structure
export interface RecipientFilter {
  roleType?: string;
  team?: string;
  area?: string;
  region?: string;
}

// Props for the RecipientSelector component
interface RecipientSelectorProps {
  filter: RecipientFilter;
  onChange: (filter: RecipientFilter) => void;
  onPreviewRequest: () => void;
  disabled?: boolean;
}

// Fetch options for each filter field
const fetchFilterOptions = async (field: string, parentFilter?: RecipientFilter) => {
  const queryParams = new URLSearchParams();
  
  if (field !== 'roleType' && parentFilter?.roleType) {
    queryParams.append('roleType', parentFilter.roleType);
  }
  
  if (field !== 'team' && field !== 'roleType' && parentFilter?.team) {
    queryParams.append('team', parentFilter.team);
  }
  
  if (field === 'region' && parentFilter?.area) {
    queryParams.append('area', parentFilter.area);
  }
  
  const response = await fetch(`/api/organization/${field}?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${field} options`);
  }
  
  const data = await response.json();
  return data.options || [];
};

export function RecipientSelector({ 
  filter, 
  onChange, 
  onPreviewRequest,
  disabled = false 
}: RecipientSelectorProps) {
  // Track if filters have been modified
  const [isModified, setIsModified] = useState(false);
  
  // Reset dependent fields when parent field changes
  const handleFilterChange = (field: keyof RecipientFilter, value: string | undefined) => {
    const newFilter = { ...filter };
    
    // Update the selected field
    newFilter[field] = value;
    
    // Reset dependent fields
    if (field === 'roleType') {
      newFilter.team = undefined;
      newFilter.area = undefined;
      newFilter.region = undefined;
    } else if (field === 'team') {
      newFilter.area = undefined;
      newFilter.region = undefined;
    } else if (field === 'area') {
      newFilter.region = undefined;
    }
    
    setIsModified(true);
    onChange(newFilter);
  };
  
  // Fetch role types
  const roleTypesQuery = useQuery({
    queryKey: ['roleTypes'],
    queryFn: () => fetchFilterOptions('roleType'),
  });
  
  // Fetch teams based on selected role type
  const teamsQuery = useQuery({
    queryKey: ['teams', filter.roleType],
    queryFn: () => fetchFilterOptions('team', filter),
    enabled: !!filter.roleType,
  });
  
  // Fetch areas based on selected team
  const areasQuery = useQuery({
    queryKey: ['areas', filter.roleType, filter.team],
    queryFn: () => fetchFilterOptions('area', filter),
    enabled: !!filter.team,
  });
  
  // Fetch regions based on selected area
  const regionsQuery = useQuery({
    queryKey: ['regions', filter.roleType, filter.team, filter.area],
    queryFn: () => fetchFilterOptions('region', filter),
    enabled: !!filter.area,
  });
  
  // Reset modified state when preview is requested
  useEffect(() => {
    setIsModified(false);
  }, [onPreviewRequest]);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Select Recipients</CardTitle>
        <CardDescription>
          Filter recipients by organizational structure
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {roleTypesQuery.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load filter options. Please try again.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          {/* Role Type Filter */}
          <div className="space-y-2">
            <Label htmlFor="roleType">Role Type</Label>
            {roleTypesQuery.isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={filter.roleType}
                onValueChange={(value) => handleFilterChange('roleType', value)}
                disabled={disabled}
              >
                <SelectTrigger id="roleType">
                  <SelectValue placeholder="Select role type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Role Types</SelectItem>
                  {roleTypesQuery.data?.map((option: string) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          {/* Team Filter */}
          <div className="space-y-2">
            <Label htmlFor="team">Team</Label>
            {filter.roleType && teamsQuery.isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={filter.team}
                onValueChange={(value) => handleFilterChange('team', value)}
                disabled={disabled || !filter.roleType}
              >
                <SelectTrigger id="team">
                  <SelectValue placeholder={filter.roleType ? "Select team" : "Select role type first"} />
                </SelectTrigger>
                <SelectContent>
                  {filter.roleType && (
                    <SelectItem value="">All Teams</SelectItem>
                  )}
                  {teamsQuery.data?.map((option: string) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          {/* Area Filter */}
          <div className="space-y-2">
            <Label htmlFor="area">Area</Label>
            {filter.team && areasQuery.isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={filter.area}
                onValueChange={(value) => handleFilterChange('area', value)}
                disabled={disabled || !filter.team}
              >
                <SelectTrigger id="area">
                  <SelectValue placeholder={filter.team ? "Select area" : "Select team first"} />
                </SelectTrigger>
                <SelectContent>
                  {filter.team && (
                    <SelectItem value="">All Areas</SelectItem>
                  )}
                  {areasQuery.data?.map((option: string) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          {/* Region Filter */}
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            {filter.area && regionsQuery.isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={filter.region}
                onValueChange={(value) => handleFilterChange('region', value)}
                disabled={disabled || !filter.area}
              >
                <SelectTrigger id="region">
                  <SelectValue placeholder={filter.area ? "Select region" : "Select area first"} />
                </SelectTrigger>
                <SelectContent>
                  {filter.area && (
                    <SelectItem value="">All Regions</SelectItem>
                  )}
                  {regionsQuery.data?.map((option: string) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        
        {/* Active Filters Display */}
        <div className="pt-4">
          <Label>Active Filters:</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {!filter.roleType && !filter.team && !filter.area && !filter.region ? (
              <span className="text-muted-foreground text-sm">No filters applied (all recipients)</span>
            ) : (
              <>
                {filter.roleType && (
                  <Badge variant="secondary" className="text-xs">
                    Role: {filter.roleType}
                  </Badge>
                )}
                {filter.team && (
                  <Badge variant="secondary" className="text-xs">
                    Team: {filter.team}
                  </Badge>
                )}
                {filter.area && (
                  <Badge variant="secondary" className="text-xs">
                    Area: {filter.area}
                  </Badge>
                )}
                {filter.region && (
                  <Badge variant="secondary" className="text-xs">
                    Region: {filter.region}
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Preview Button */}
        <Button 
          onClick={onPreviewRequest}
          disabled={disabled || (!isModified && !!onPreviewRequest)}
          className="w-full mt-4"
        >
          Preview Recipients
        </Button>
      </CardContent>
    </Card>
  );
} 