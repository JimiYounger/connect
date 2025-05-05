'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Contact, Department } from '../types';
import { SortableContactList } from './SortableContactList';

interface DepartmentGroupProps {
  department: Department & { contacts: Contact[] };
}

export function DepartmentGroup({ department }: DepartmentGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3 px-4 bg-muted/20">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0 hover:bg-transparent"
          >
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <CardTitle className="text-base font-medium flex items-center">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                {department.name}
                <span className="ml-2 text-sm text-muted-foreground font-normal">
                  ({department.contacts.length})
                </span>
              </CardTitle>
            </div>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent
        className={cn(
          "p-0 transition-all duration-200 ease-in-out overflow-hidden",
          isExpanded ? "max-h-[2000px]" : "max-h-0"
        )}
      >
        <div className="p-2">
          <SortableContactList 
            contacts={department.contacts} 
            departmentId={department.id} 
          />
        </div>
      </CardContent>
    </Card>
  );
} 