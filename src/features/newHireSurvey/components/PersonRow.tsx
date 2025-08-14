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
    <Card className="p-4 bg-gray-800 hover:bg-gray-750 hover:shadow-md transition-all cursor-pointer border-l-4 border-l-blue-400 border border-gray-600" onClick={handleClick}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h4 className="text-lg font-semibold text-white flex-1">
            {person.name}
          </h4>
          <Button 
            variant="outline" 
            size="sm"
            className="text-sm px-4 py-2 h-auto flex-shrink-0 font-medium border-gray-500 text-white bg-gray-700 hover:bg-gray-600 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            View Details
          </Button>
        </div>
        
        {person.highlights.length > 0 ? (
          <div className="mt-4">
            <div className="text-sm font-medium text-white mb-3">
              Survey Highlights
            </div>
            <HighlightTable 
              highlights={person.highlights}
            />
          </div>
        ) : (
          <div className="text-sm text-gray-300 italic py-4 text-center border border-dashed border-gray-500 rounded-lg bg-gray-700">
            No survey responses available
          </div>
        )}
      </div>
    </Card>
  );
}