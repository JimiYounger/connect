'use client';

import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { PersonRow } from './PersonRow';
import { PersonDetail } from './PersonDetail';
import type { Person } from '../lib/types';

interface AreaAccordionProps {
  areas: string[];
  people: Person[];
}

export function AreaAccordion({ areas, people }: AreaAccordionProps) {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const handlePersonClick = (person: Person) => {
    setSelectedPerson(person);
  };

  const handleCloseDetail = () => {
    setSelectedPerson(null);
  };

  // Group people by area
  const peopleByArea = people.reduce((acc, person) => {
    if (!acc[person.area]) {
      acc[person.area] = [];
    }
    acc[person.area].push(person);
    return acc;
  }, {} as Record<string, Person[]>);

  if (areas.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">
          <p className="text-lg mb-2">No Data Available</p>
          <p className="text-sm">No new hire survey data found.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Accordion type="multiple" className="w-full space-y-2">
        {areas.map((area) => {
          const areaPeople = peopleByArea[area] || [];
          
          return (
            <AccordionItem
              key={area}
              value={area}
              className="border border-gray-200 rounded-lg px-4 py-2"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full mr-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {area}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {areaPeople.length}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                {areaPeople.length === 0 ? (
                  <div className="text-sm text-gray-500 italic py-4">
                    No people found in this area
                  </div>
                ) : (
                  <div className="space-y-3">
                    {areaPeople.map((person) => (
                      <PersonRow
                        key={person.id}
                        person={person}
                        onViewDetails={handlePersonClick}
                      />
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <PersonDetail
        person={selectedPerson}
        open={!!selectedPerson}
        onClose={handleCloseDetail}
      />
    </>
  );
}