'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HighlightTable } from './HighlightTable';
import type { Person } from '../lib/types';

interface PersonRowProps {
  person: Person;
  onViewDetails: (person: Person) => void;
}

export function PersonRow({ person, onViewDetails }: PersonRowProps) {
  const handleClick = () => {
    onViewDetails(person);
  };

  return (
    <Card className="p-3 hover:bg-gray-50 transition-colors cursor-pointer" onClick={handleClick}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 truncate">
              {person.name}
            </h4>
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs px-2 py-1 h-auto flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              View Details
            </Button>
          </div>
          
          <HighlightTable 
            highlights={person.highlights}
            className="mt-2"
          />
          
          {person.qa.length === 0 && (
            <div className="text-sm text-gray-500 italic mt-2">
              No survey responses available
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}