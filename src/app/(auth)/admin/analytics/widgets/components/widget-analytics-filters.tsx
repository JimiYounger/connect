import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { WidgetType } from '@/features/widgets/types';
import { Separator } from '@/components/ui/separator';

interface WidgetAnalyticsFiltersProps {
  widgetTypes: WidgetType[];
  dashboards: Array<{ id: string; name: string }>;
  userRoles: string[];
  filters: {
    widgetTypes: WidgetType[];
    dashboardIds: string[];
    userRoles: string[];
    minInteractions: number;
  };
  onApplyFilters: (filters: any) => void;
  onResetFilters: () => void;
}

export function WidgetAnalyticsFilters({ 
  widgetTypes, 
  dashboards, 
  userRoles, 
  filters, 
  onApplyFilters, 
  onResetFilters 
}: WidgetAnalyticsFiltersProps) {
  const [localFilters, setLocalFilters] = useState({ ...filters });
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleWidgetType = (type: WidgetType) => {
    setLocalFilters(prev => {
      if (prev.widgetTypes.includes(type)) {
        return {
          ...prev,
          widgetTypes: prev.widgetTypes.filter(t => t !== type)
        };
      } else {
        return {
          ...prev,
          widgetTypes: [...prev.widgetTypes, type]
        };
      }
    });
  };
  
  const toggleDashboard = (id: string) => {
    setLocalFilters(prev => {
      if (prev.dashboardIds.includes(id)) {
        return {
          ...prev,
          dashboardIds: prev.dashboardIds.filter(d => d !== id)
        };
      } else {
        return {
          ...prev,
          dashboardIds: [...prev.dashboardIds, id]
        };
      }
    });
  };
  
  const toggleUserRole = (role: string) => {
    setLocalFilters(prev => {
      if (prev.userRoles.includes(role)) {
        return {
          ...prev,
          userRoles: prev.userRoles.filter(r => r !== role)
        };
      } else {
        return {
          ...prev,
          userRoles: [...prev.userRoles, role]
        };
      }
    });
  };
  
  const handleApplyFilters = () => {
    onApplyFilters(localFilters);
    setIsOpen(false);
  };
  
  const handleResetFilters = () => {
    const emptyFilters = {
      widgetTypes: [],
      dashboardIds: [],
      userRoles: [],
      minInteractions: 0
    };
    setLocalFilters(emptyFilters);
    onResetFilters();
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Filter Analytics</SheetTitle>
          <SheetDescription>
            Customize the analytics view with filters
          </SheetDescription>
        </SheetHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <h4 className="font-medium">Widget Types</h4>
            <div className="grid grid-cols-2 gap-2">
              {widgetTypes.map(type => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`type-${type}`}
                    checked={localFilters.widgetTypes.includes(type)}
                    onCheckedChange={() => toggleWidgetType(type)}
                  />
                  <Label htmlFor={`type-${type}`}>{type}</Label>
                </div>
              ))}
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h4 className="font-medium">Dashboards</h4>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
              {dashboards.map(dashboard => (
                <div key={dashboard.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`dashboard-${dashboard.id}`}
                    checked={localFilters.dashboardIds.includes(dashboard.id)}
                    onCheckedChange={() => toggleDashboard(dashboard.id)}
                  />
                  <Label htmlFor={`dashboard-${dashboard.id}`}>{dashboard.name}</Label>
                </div>
              ))}
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h4 className="font-medium">User Roles</h4>
            <div className="grid grid-cols-2 gap-2">
              {userRoles.map(role => (
                <div key={role} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`role-${role}`}
                    checked={localFilters.userRoles.includes(role)}
                    onCheckedChange={() => toggleUserRole(role)}
                  />
                  <Label htmlFor={`role-${role}`}>{role}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={handleResetFilters}>
            Reset
          </Button>
          <Button onClick={handleApplyFilters}>
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}